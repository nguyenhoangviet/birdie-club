import { getAdminSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { redis } from "@/lib/redis";
import { DEFAULT_SLIDES } from "@/lib/slides";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session.isAdmin) redirect("/admin/login");

  const activityIds = (await redis.lrange("activities", 0, -1)) as string[];
  const activities = (
    await Promise.all(
      activityIds.map((id) => redis.hgetall<Record<string, string>>(`activity:${id}`))
    )
  ).filter(Boolean) as unknown as Array<Record<string, string>>;

  const eventIds = (await redis.zrange("events", 0, -1)) as string[];
  const events = (
    await Promise.all(
      eventIds.map((id) => redis.hgetall<Record<string, string>>(`event:${id}`))
    )
  ).filter(Boolean) as unknown as Array<Record<string, string>>;

  const initialSlides = await Promise.all(
    [0, 1, 2].map(async (i) => {
      const s = await redis.hgetall<Record<string, string>>(`slider:${i}`);
      return (s && s.title) ? { ...s, flickrUrl: s.flickrUrl ?? "" } : { ...DEFAULT_SLIDES[i], flickrUrl: "" };
    })
  );

  const featuredEventId = ((await redis.get("slider:featured")) as string | null) ?? "";

  return (
    <AdminDashboard
      initialActivities={activities as never}
      initialEvents={events as never}
      initialSlides={initialSlides as never}
      initialFeaturedEventId={featuredEventId}
    />
  );
}
