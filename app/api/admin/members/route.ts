import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
import { redis } from "@/lib/redis";
import { upsertMember } from "@/lib/members";
import { randomUUID } from "crypto";

export async function GET() {
  const session = await getAdminSession();
  if (!session.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Backfill: ensure every user who has ever booked appears as a member
  const bookingKeys = (await redis.keys("userBookings:*")) as string[];
  await Promise.all(
    bookingKeys.map(async (key) => {
      const email = key.replace("userBookings:", "");
      const existing = await redis.hgetall<Record<string, string>>(`member:${email}`);
      if (!existing || !existing.id) {
        const [latestId] = (await redis.zrange(key, 0, 0, { rev: true })) as string[];
        if (latestId) {
          const booking = await redis.hgetall<Record<string, string>>(`booking:${latestId}`);
          if (booking) {
            await upsertMember(email, booking.name ?? "", booking.phone ?? "", "booking");
          }
        }
      }
    })
  );

  const emails = (await redis.zrange("members", 0, -1, { rev: true })) as string[];
  const members = (
    await Promise.all(emails.map((e) => redis.hgetall<Record<string, string>>(`member:${e}`)))
  ).filter(Boolean) as Array<Record<string, string>>;

  return NextResponse.json({ members });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const name = (body?.name ?? "").trim();
  const email = (body?.email ?? "").trim().toLowerCase();
  const phone = (body?.phone ?? "").trim();

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const existing = await redis.hgetall<Record<string, string>>(`member:${email}`);
  if (existing && existing.id) {
    return NextResponse.json({ error: "A member with this email already exists" }, { status: 409 });
  }

  const id = randomUUID();
  const createdAt = new Date().toISOString();
  await redis.hset(`member:${email}`, { id, email, name, phone, createdAt, source: "manual" });
  await redis.zadd("members", { score: Date.now(), member: email });

  return NextResponse.json({ member: { id, email, name, phone, createdAt, source: "manual" } }, { status: 201 });
}
