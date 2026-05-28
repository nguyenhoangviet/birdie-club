import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { getAdminSession } from "@/lib/session";
import { SLOT_HOURS } from "@/lib/slots";

export async function GET() {
  const session = await getAdminSession();
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ids = (await redis.zrange("events", 0, -1)) as string[];
  const events = (
    await Promise.all(ids.map((id) => redis.hgetall<Record<string, string>>(`event:${id}`)))
  ).filter(Boolean);

  return NextResponse.json({ events });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const title = (body?.title ?? "").trim();
  const date = (body?.date ?? "").trim();
  const startTime = (body?.startTime ?? "").trim();
  const endTime = (body?.endTime ?? "").trim();
  const time = startTime && endTime ? `${startTime} - ${endTime}` : (body?.time ?? "").trim();
  const location = (body?.location ?? "").trim();
  const description = (body?.description ?? "").trim();
  const flickrUrl = (body?.flickrUrl ?? "").trim();
  const totalSlots = Number(body?.totalSlots ?? 0);
  const blockBookings = body?.blockBookings ? "1" : "";

  if (!title || !date) {
    return NextResponse.json({ error: "Title and date are required" }, { status: 400 });
  }

  let imageUrl = "";
  if (flickrUrl) {
    try {
      const res = await fetch(
        `https://www.flickr.com/services/oembed/?url=${encodeURIComponent(flickrUrl)}&format=json`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json();
        const thumbnail: string = data.thumbnail_url ?? "";
        imageUrl = thumbnail.replace(/_[sqtmnzcbo]\.(jpg|jpeg|png)$/i, "_z.$1");
      }
    } catch {
      // ignore — event saved without image
    }
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const score = new Date(date).getTime();

  await redis.hset(`event:${id}`, { id, title, date, time, startTime, endTime, location, description, flickrUrl, imageUrl, totalSlots: String(totalSlots), blockBookings, createdAt });
  await redis.zadd("events", { score, member: id });

  // Set slot blocks if blockBookings enabled
  if (blockBookings && date && startTime && endTime) {
    const startHour = parseInt(startTime.split(":")[0], 10);
    const endHour = parseInt(endTime.split(":")[0], 10);
    const blockedHours = SLOT_HOURS.filter((h) => h >= startHour && h < endHour);
    await Promise.all(blockedHours.map((h) => redis.set(`eventBlock:${date}:${h}`, id)));
  }

  return NextResponse.json({ success: true, id });
}
