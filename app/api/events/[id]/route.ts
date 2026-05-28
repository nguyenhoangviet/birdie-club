import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ev = await redis.hgetall<Record<string, string>>(`event:${id}`);
  if (!ev || !ev.title) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const totalSlots = Number(ev.totalSlots) || 0;
  const usedSlots = Number((await redis.get(`eventUsedSlots:${id}`)) ?? 0);

  return NextResponse.json({
    id,
    title: ev.title,
    date: ev.date,
    time: ev.time ?? "",
    location: ev.location ?? "",
    totalSlots,
    usedSlots,
    cancelled: ev.cancelled === "1",
  });
}
