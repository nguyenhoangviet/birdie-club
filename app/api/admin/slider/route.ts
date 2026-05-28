import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { getAdminSession } from "@/lib/session";
import { DEFAULT_SLIDES } from "@/lib/slides";

export async function GET() {
  const session = await getAdminSession();
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [slides, rawDuration] = await Promise.all([
    Promise.all(
      [0, 1, 2].map(async (i) => {
        const s = await redis.hgetall<Record<string, string>>(`slider:${i}`);
        return s && s.title ? s : DEFAULT_SLIDES[i];
      })
    ),
    redis.get("slider:eventDuration"),
  ]);

  const eventDuration = Number(rawDuration) || 8000;
  return NextResponse.json({ slides, eventDuration });
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);

  // Save event slide duration
  if (body?.eventDuration !== undefined && body?.index === undefined) {
    const dur = Number(body.eventDuration);
    if (isNaN(dur) || dur < 1000 || dur > 60000) {
      return NextResponse.json({ error: "Duration must be between 1 and 60 seconds" }, { status: 400 });
    }
    await redis.set("slider:eventDuration", String(dur));
    return NextResponse.json({ success: true });
  }

  const index = Number(body?.index);
  if (isNaN(index) || index < 0 || index > 2) {
    return NextResponse.json({ error: "Invalid slide index" }, { status: 400 });
  }

  const title = (body?.title ?? "").trim();
  const sub = (body?.sub ?? "").trim();
  const flickrUrl = (body?.flickrUrl ?? "").trim();
  const gradient = (body?.gradient ?? "").trim() || DEFAULT_SLIDES[index].gradient;
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
        // Use _b (1024px) for hero slider quality
        imageUrl = thumbnail.replace(/_[sqtmnzcbo]\.(jpg|jpeg|png)$/i, "_b.$1");
      }
    } catch {
      // keep existing image
    }
  }

  await redis.hset(`slider:${index}`, { title, sub, imageUrl, flickrUrl, gradient });
  return NextResponse.json({ success: true, imageUrl });
}
