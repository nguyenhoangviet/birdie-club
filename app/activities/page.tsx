import { redis } from "@/lib/redis";
import { getSession } from "@/lib/session";
import { NavBar } from "@/components/NavBar";

interface Activity {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  flickrUrl?: string;
  createdAt: string;
}

export default async function ActivitiesPage() {
  const session = await getSession();
  const ids = (await redis.lrange("activities", 0, -1)) as string[];

  const activities = (
    await Promise.all(
      ids.map((id) => redis.hgetall<Record<string, string>>(`activity:${id}`))
    )
  ).filter(Boolean) as unknown as Activity[];

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar email={session.isLoggedIn ? session.email : null} />

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Our Activities</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Photos and highlights from our coaching sessions &amp; club events.
          </p>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <span className="text-5xl block mb-4">🏸</span>
            <p className="text-gray-400">No activities yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {activities.map((a) => (
              <div
                key={a.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {a.imageUrl ? (
                  <img
                    src={a.imageUrl}
                    alt={a.title}
                    className="w-full h-52 object-cover"
                  />
                ) : (
                  <div className="h-52 bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center">
                    <span className="text-white text-5xl">🏸</span>
                  </div>
                )}
                <div className="p-5">
                  <h2 className="font-bold text-gray-900 leading-snug">{a.title}</h2>
                  {a.description && (
                    <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                      {a.description}
                    </p>
                  )}
                  {a.flickrUrl && (
                    <a
                      href={a.flickrUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-green-600 text-sm mt-3 hover:underline font-medium"
                    >
                      View on Flickr →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
