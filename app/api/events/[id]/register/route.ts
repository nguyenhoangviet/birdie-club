import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { upsertMember } from "@/lib/members";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const ev = await redis.hgetall<Record<string, string>>(`event:${id}`);
  if (!ev || !ev.title) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  if (ev.cancelled === "1") {
    return NextResponse.json({ error: "This event has been cancelled" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const name = (body?.name ?? "").trim();
  const email = (body?.email ?? "").trim().toLowerCase();
  const phone = (body?.phone ?? "").trim();
  const seats = Number(body?.seats ?? 1);

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }
  if (!Number.isInteger(seats) || seats < 1 || seats > 10) {
    return NextResponse.json({ error: "Seats must be between 1 and 10" }, { status: 400 });
  }

  // Check capacity
  const totalSlots = Number(ev.totalSlots) || 0;
  if (totalSlots > 0) {
    const usedSlots = Number((await redis.get(`eventUsedSlots:${id}`)) ?? 0);
    if (usedSlots + seats > totalSlots) {
      const remaining = Math.max(0, totalSlots - usedSlots);
      return NextResponse.json(
        { error: remaining === 0 ? "This event is fully booked" : `Only ${remaining} seat${remaining > 1 ? "s" : ""} remaining` },
        { status: 409 }
      );
    }
  }

  const regId = crypto.randomUUID();
  const registeredAt = new Date().toISOString();

  await redis.hset(`eventRegistration:${regId}`, {
    id: regId,
    eventId: id,
    eventTitle: ev.title,
    eventDate: ev.date,
    eventTime: ev.time ?? "",
    email,
    name,
    phone,
    seats: String(seats),
    status: "pending",
    registeredAt,
  });

  await redis.zadd(`eventRegs:${id}`, { score: Date.now(), member: regId });
  if (totalSlots > 0) {
    await redis.incrby(`eventUsedSlots:${id}`, seats);
  }

  // Auto-register member
  await upsertMember(email, name, phone, "event");

  return NextResponse.json({ success: true, regId });
}
