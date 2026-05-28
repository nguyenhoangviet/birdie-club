import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { getAdminSession } from "@/lib/session";
import { SLOT_HOURS } from "@/lib/slots";
import { sendEventCancelledEmail } from "@/lib/email";

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

  // Get existing event to handle block changes
  const existing = await redis.hgetall<Record<string, string>>(`event:${id}`);

  // Clear old event blocks if they existed
  if (existing?.blockBookings === "1" && existing.date && existing.startTime && existing.endTime) {
    const oldStartH = parseInt(existing.startTime.split(":")[0], 10);
    const oldEndH = parseInt(existing.endTime.split(":")[0], 10);
    const oldBlocked = SLOT_HOURS.filter((h) => h >= oldStartH && h < oldEndH);
    await Promise.all(oldBlocked.map((h) => redis.del(`eventBlock:${existing.date}:${h}`)));
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

  const score = new Date(date).getTime();
  await redis.hset(`event:${id}`, { title, date, time, startTime, endTime, location, description, flickrUrl, imageUrl, totalSlots: String(totalSlots), blockBookings });
  await redis.zadd("events", { score, member: id });

  // Set new event blocks
  if (blockBookings && date && startTime && endTime) {
    const startHour = parseInt(startTime.split(":")[0], 10);
    const endHour = parseInt(endTime.split(":")[0], 10);
    const blockedHours = SLOT_HOURS.filter((h) => h >= startHour && h < endHour);
    await Promise.all(blockedHours.map((h) => redis.set(`eventBlock:${date}:${h}`, id)));
  }

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
  const ev = await redis.hgetall<Record<string, string>>(`event:${id}`);

  if (ev) {
    // Remove slot blocks
    if (ev.blockBookings === "1" && ev.date && ev.startTime && ev.endTime) {
      const startHour = parseInt(ev.startTime.split(":")[0], 10);
      const endHour = parseInt(ev.endTime.split(":")[0], 10);
      const blockedHours = SLOT_HOURS.filter((h) => h >= startHour && h < endHour);
      await Promise.all(blockedHours.map((h) => redis.del(`eventBlock:${ev.date}:${h}`)));
    }

    // Email confirmed registrants about deletion
    const regIds = (await redis.zrange(`eventRegs:${id}`, 0, -1)) as string[];
    const regs = (
      await Promise.all(regIds.map((rid) => redis.hgetall<Record<string, string>>(`eventRegistration:${rid}`)))
    ).filter((r): r is Record<string, string> => !!r && r.status === "confirmed");

    for (const r of regs) {
      sendEventCancelledEmail(r.email, r.name, ev.title, ev.date, "").catch(console.error);
    }

    // Clean up registrations
    for (const rid of regIds) {
      await redis.del(`eventRegistration:${rid}`);
    }
    await redis.del(`eventRegs:${id}`);
    await redis.del(`eventUsedSlots:${id}`);
  }

  await redis.zrem("events", id);
  await redis.del(`event:${id}`);

  return NextResponse.json({ success: true });
}

