import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { getAdminSession } from "@/lib/session";

export async function GET() {
  const session = await getAdminSession();
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ids = (await redis.lrange("activities", 0, -1)) as string[];
  const activities = (
    await Promise.all(ids.map((id) => redis.hgetall<Record<string, string>>(`activity:${id}`)))
  ).filter(Boolean);

  return NextResponse.json({ activities });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const flickrUrl = (body?.flickrUrl ?? "").trim();
  const title = (body?.title ?? "").trim();
  const description = (body?.description ?? "").trim();

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
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
        // Upgrade Flickr thumbnail to 640px-wide (_z) version
        imageUrl = thumbnail.replace(/_[sqtmnzcbo]\.(jpg|jpeg|png)$/i, "_z.$1");
      }
    } catch {
      // ignore — activity saved without image
    }
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  await redis.hset(`activity:${id}`, {
    id,
    title,
    description,
    imageUrl,
    flickrUrl,
    createdAt,
  });
  await redis.lpush("activities", id);

  return NextResponse.json({ success: true, id });
}
