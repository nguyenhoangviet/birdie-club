import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { getAdminSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const eventId = (body?.eventId ?? "").trim();
  if (!eventId) {
    return NextResponse.json({ error: "eventId required" }, { status: 400 });
  }

  // Unfeature previous event
  const prevId = (await redis.get("slider:featured")) as string | null;
  if (prevId && prevId !== eventId) {
    await redis.hset(`event:${prevId}`, { featured: "" });
  }

  await redis.set("slider:featured", eventId);
  await redis.hset(`event:${eventId}`, { featured: "1" });

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const session = await getAdminSession();
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prevId = (await redis.get("slider:featured")) as string | null;
  if (prevId) {
    await redis.hset(`event:${prevId}`, { featured: "" });
  }
  await redis.del("slider:featured");

  return NextResponse.json({ success: true });
}
