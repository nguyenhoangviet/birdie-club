import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { redis } from "@/lib/redis";
import { NavBar } from "@/components/NavBar";
import { BookingList } from "@/components/BookingList";
import { formatSlotRange, isPastSlot, isWithin24Hours } from "@/lib/slots";

export default async function MyBookingsPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");

  const email = session.email;

  // Get all booking IDs for this user (newest first via reversed sorted set)
  const ids = await redis.zrange<string[]>(`userBookings:${email}`, 0, -1, { rev: true });

  type Booking = {
    id: string;
    email: string;
    date: string;
    hour: string;
    status: string;
    createdAt: string;
  };

  let bookings: Booking[] = [];

  if (ids.length > 0) {
    const pipeline = redis.pipeline();
    for (const id of ids) {
      pipeline.hgetall(`booking:${id}`);
    }
    const results = await pipeline.exec<(Booking | null)[]>();
    bookings = results.filter((b): b is Booking => b !== null);
  }

  const upcoming = bookings
    .filter((b) => b.status === "confirmed" && !isPastSlot(b.date, Number(b.hour)))
    .map((b) => ({
      id: b.id,
      date: b.date,
      hour: Number(b.hour),
      slotLabel: formatSlotRange(Number(b.hour)),
      canCancel: !isWithin24Hours(b.date, Number(b.hour)),
    }));

  const past = bookings
    .filter((b) => b.status === "confirmed" && isPastSlot(b.date, Number(b.hour)))
    .slice(0, 20)
    .map((b) => ({
      id: b.id,
      date: b.date,
      hour: Number(b.hour),
      slotLabel: formatSlotRange(Number(b.hour)),
      canCancel: false,
    }));

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar email={email} />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h1>
        <BookingList upcoming={upcoming} past={past} />
      </main>
    </div>
  );
}
