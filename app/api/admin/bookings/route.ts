import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { getSession } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";
import { isPastSlot } from "@/lib/slots";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || !isAdminEmail(session.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch all booking IDs, newest first
  const ids = await redis.zrange<string[]>("allBookings", 0, -1, { rev: true });

  if (ids.length === 0) {
    return NextResponse.json({ bookings: [] });
  }

  type Booking = {
    id: string;
    email: string;
    date: string;
    hour: string;
    status: string;
    createdAt: string;
  };

  const pipeline = redis.pipeline();
  for (const id of ids) {
    pipeline.hgetall(`booking:${id}`);
  }
  const results = await pipeline.exec<(Booking | null)[]>();

  const bookings = results
    .filter((b): b is Booking => b !== null)
    .filter(
      (b) =>
        b.status === "pending" ||
        (b.status === "confirmed" && !isPastSlot(b.date, Number(b.hour)))
    )
    .map((b) => ({ ...b, hour: Number(b.hour) }));

  return NextResponse.json({ bookings });
}
