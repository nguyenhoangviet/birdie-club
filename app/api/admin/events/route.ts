import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { getAdminSession } from "@/lib/session";

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
  const time = (body?.time ?? "").trim();
  const location = (body?.location ?? "").trim();
  const description = (body?.description ?? "").trim();

  if (!title || !date) {
    return NextResponse.json({ error: "Title and date are required" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const score = new Date(date).getTime();

  await redis.hset(`event:${id}`, { id, title, date, time, location, description, createdAt });
  await redis.zadd("events", { score, member: id });

  return NextResponse.json({ success: true, id });
}
