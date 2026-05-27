import { redis } from "@/lib/redis";
import { getSession } from "@/lib/session";
import { NavBar } from "@/components/NavBar";
import { ActivitiesGallery } from "@/components/ActivitiesGallery";

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
          <ActivitiesGallery activities={activities} />
        )}
      </main>
    </div>
  );
}
