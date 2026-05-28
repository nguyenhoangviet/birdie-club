import { getAdminSession } from "@/lib/session";
import { listMembers, syncMembersFromBookings } from "@/lib/members";
import { redirect } from "next/navigation";
import { redis } from "@/lib/redis";
import { DEFAULT_SLIDES } from "@/lib/slides";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session.isAdmin) redirect("/admin/login");

  // Fire-and-forget — don't block page render with a full redis.keys() scan
  syncMembersFromBookings().catch(() => {});

  // Fetch all top-level IDs and scalar values in parallel
  const [
    activityIds,
    eventIds,
    slide0, slide1, slide2,
    rawFeaturedId,
    rawEventDuration,
    campaignIds,
  ] = await Promise.all([
    redis.lrange("activities", 0, -1),
    redis.zrange("events", 0, -1),
    redis.hgetall<Record<string, string>>("slider:0"),
    redis.hgetall<Record<string, string>>("slider:1"),
    redis.hgetall<Record<string, string>>("slider:2"),
    redis.get<string>("slider:featured"),
    redis.get<string>("slider:eventDuration"),
    redis.zrange("campaigns", 0, -1, { rev: true }),
  ]);

  const featuredEventId = (rawFeaturedId as string | null) ?? "";
  const initialEventDuration = Number(rawEventDuration) || 8000;

  const rawSlides = [slide0, slide1, slide2];
  const initialSlides = rawSlides.map((s, i) =>
    (s && (s as Record<string, string>).title)
      ? { ...(s as Record<string, string>), flickrUrl: (s as Record<string, string>).flickrUrl ?? "" }
      : { ...DEFAULT_SLIDES[i], flickrUrl: "" }
  );

  // Fetch all secondary data in parallel
  const [activitiesRaw, eventsRaw, eventUsedSlotsRaw, initialMembers, initialCampaignsRaw] = await Promise.all([
    Promise.all((activityIds as string[]).map((id) => redis.hgetall<Record<string, string>>(`activity:${id}`))),
    Promise.all((eventIds as string[]).map((id) => redis.hgetall<Record<string, string>>(`event:${id}`))),
    Promise.all((eventIds as string[]).map((id) => redis.get<string>(`eventUsedSlots:${id}`))),
    listMembers(),
    Promise.all((campaignIds as string[]).map((id) => redis.hgetall<Record<string, string>>(`campaign:${id}`))),
  ]);

  const activities = activitiesRaw.filter(Boolean) as unknown as Array<Record<string, string>>;
  const events = eventsRaw
    .map((ev, i) => {
      if (!ev) return null;
      const totalSlots = Number((ev as Record<string, string>).totalSlots) || 0;
      const usedSlots = totalSlots > 0 ? Number(eventUsedSlotsRaw[i] ?? 0) : 0;
      return { ...(ev as Record<string, string>), usedSlots: String(usedSlots) };
    })
    .filter(Boolean) as unknown as Array<Record<string, string>>;
  const initialCampaigns = (initialCampaignsRaw as Array<Record<string, string> | null>)
    .filter((c) => Boolean(c && c.id)) as unknown as Array<Record<string, string>>;

  return (
    <AdminDashboard
      initialActivities={activities as never}
      initialEvents={events as never}
      initialSlides={initialSlides as never}
      initialFeaturedEventId={featuredEventId}
      initialEventDuration={initialEventDuration}
      initialMembers={initialMembers as never}
      initialCampaigns={initialCampaigns as never}
    />
  );
}
