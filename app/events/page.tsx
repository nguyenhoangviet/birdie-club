import { redis } from "@/lib/redis";
import { getSession } from "@/lib/session";
import { NavBar } from "@/components/NavBar";

interface ClubEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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

        {/* Upcoming Events */}
        {upcoming.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <span className="text-5xl block mb-4">📅</span>
            <p className="text-gray-400 font-medium">No upcoming events yet.</p>
            <p className="text-gray-300 text-sm mt-1">Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcoming.map((e) => (
              <div
                key={e.id}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-gray-900">{e.title}</h2>
                    {e.description && (
                      <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                        {e.description}
                      </p>
                    )}
                  </div>

                  <div className="flex-shrink-0 bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-center min-w-[130px]">
                    <p className="text-green-700 font-bold text-sm">
                      {formatDate(e.date)}
                    </p>
                    {e.time && (
                      <p className="text-green-600 text-sm mt-0.5">🕐 {e.time}</p>
                    )}
                  </div>
                </div>

                {e.location && (
                  <p className="text-gray-400 text-sm mt-3 flex items-center gap-1">
                    <span>📍</span> {e.location}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Past Events */}
        {past.length > 0 && (
          <div className="mt-12">
            <h2 className="text-base font-semibold text-gray-400 uppercase tracking-wide mb-4">
              Past Events
            </h2>
            <div className="space-y-3">
              {past.map((e) => (
                <div
                  key={e.id}
                  className="bg-white rounded-xl border border-gray-100 px-5 py-4 opacity-60"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-700 text-sm">{e.title}</h3>
                      {e.location && (
                        <p className="text-gray-400 text-xs mt-0.5">📍 {e.location}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(e.date)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
