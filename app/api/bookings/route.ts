import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { getSession } from "@/lib/session";
import { SLOT_HOURS, isPastSlot } from "@/lib/slots";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { date, hour } = body ?? {};

  if (!date || hour === undefined || hour === null) {
    return NextResponse.json({ error: "Date and hour are required" }, { status: 400 });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  const hourNum = Number(hour);
  if (!SLOT_HOURS.includes(hourNum)) {
    return NextResponse.json({ error: "Invalid time slot" }, { status: 400 });
  }

  if (isPastSlot(date, hourNum)) {
    return NextResponse.json({ error: "Cannot book a past slot" }, { status: 400 });
  }

  const slotKey = `slot:${date}:${hourNum}`;

  // Atomic check: only set if slot is empty (NX = only set if Not eXists)
  const id = randomUUID();
  const claimed = await redis.set(slotKey, id, { nx: true });

  if (!claimed) {
    return NextResponse.json({ error: "This slot is already booked" }, { status: 409 });
  }

  const createdAt = new Date().toISOString();
  const email = session.email;

  await redis.hset(`booking:${id}`, { id, email, date, hour: hourNum, status: "confirmed", createdAt });
  await redis.zadd(`userBookings:${email}`, { score: Date.now(), member: id });

  return NextResponse.json(
    { booking: { id, email, date, hour: hourNum, status: "confirmed", createdAt } },
    { status: 201 }
  );
}
