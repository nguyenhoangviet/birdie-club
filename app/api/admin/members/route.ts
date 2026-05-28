import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
import { redis } from "@/lib/redis";
import { listMembers, syncMembersFromBookings } from "@/lib/members";
import { randomUUID } from "crypto";

export async function GET() {
  const session = await getAdminSession();
  if (!session.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await syncMembersFromBookings();
  const members = await listMembers();

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
