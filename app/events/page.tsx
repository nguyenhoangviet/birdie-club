import { redis } from "@/lib/redis";
import { getSession } from "@/lib/session";
import { NavBar } from "@/components/NavBar";
import { EventsList } from "@/components/EventsList";

interface ClubEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  imageUrl?: string;
}

export default async function EventsPage() {
  const session = await getSession();

  const ids = (await redis.zrange("events", 0, -1)) as string[];
  const allEvents = (
    await Promise.all(
      ids.map((id) => redis.hgetall<Record<string, string>>(`event:${id}`))
    )
  ).filter(Boolean) as unknown as ClubEvent[];

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const upcoming = allEvents
    .filter((e) => new Date(e.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const past = allEvents
    .filter((e) => new Date(e.date) < now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar email={session.isLoggedIn ? session.email : null} />

      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Upcoming coaching sessions, workshops and club gatherings.
          </p>
        </div>

        <EventsList upcoming={upcoming} past={past} />
      </main>
    </div>
  );
}
