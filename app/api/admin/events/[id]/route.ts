import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { getAdminSession } from "@/lib/session";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const title = (body?.title ?? "").trim();
  const date = (body?.date ?? "").trim();
  const time = (body?.time ?? "").trim();
  const location = (body?.location ?? "").trim();
  const description = (body?.description ?? "").trim();
  const flickrUrl = (body?.flickrUrl ?? "").trim();

  if (!title || !date) {
    return NextResponse.json({ error: "Title and date are required" }, { status: 400 });
  }

  // Re-fetch image only if flickrUrl provided
  let imageUrl = (body?.existingImageUrl ?? "").trim();
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
      // keep existing image
    }
  }

  // Update score in sorted set if date changed
  const score = new Date(date).getTime();
  await redis.hset(`event:${id}`, { title, date, time, location, description, flickrUrl, imageUrl });
  await redis.zadd("events", { score, member: id });

  return NextResponse.json({ success: true, id });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await redis.zrem("events", id);
  await redis.del(`event:${id}`);

  return NextResponse.json({ success: true });
}
