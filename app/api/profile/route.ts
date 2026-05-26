import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile =
    (await redis.hgetall<Record<string, string>>(`profile:${session.email}`)) ?? {};

  return NextResponse.json({ profile });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const name = (body?.name ?? "").trim();
  const phone = (body?.phone ?? "").trim();
  const birthday = (body?.birthday ?? "").trim();

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const data: Record<string, string> = { name };
  if (phone) data.phone = phone;
  if (birthday) data.birthday = birthday;

  await redis.hset(`profile:${session.email}`, data);

  return NextResponse.json({ success: true });
}
