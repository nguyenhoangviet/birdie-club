import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { getSession } from "@/lib/session";
import { SLOT_HOURS, isPastSlot, LUNCH_HOURS } from "@/lib/slots";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "from and to dates required" }, { status: 400 });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  // Build list of (date, hour) pairs for the range
  const pairs: Array<{ date: string; hour: number }> = [];
  const start = new Date(from + "T12:00:00");
  const end = new Date(to + "T12:00:00");
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    for (const hour of SLOT_HOURS) {
      pairs.push({ date: dateStr, hour });
    }
  }

  // Pipeline GET for all slot keys + event block keys
  const pipeline = redis.pipeline();
  for (const { date, hour } of pairs) {
    pipeline.get(`slot:${date}:${hour}`);
  }
  for (const { date, hour } of pairs) {
    pipeline.get(`eventBlock:${date}:${hour}`);
  }
  const results = await pipeline.exec<(string | null)[]>();
  const bookingIds = results.slice(0, pairs.length);
  const eventBlocks = results.slice(pairs.length);

  // Collect unique non-null booking IDs and fetch their data
  const uniqueIds = [...new Set(bookingIds.filter((id): id is string => id !== null))];
  const bookingMap: Record<string, Record<string, string>> = {};

  if (uniqueIds.length > 0) {
    const bp = redis.pipeline();
    for (const id of uniqueIds) {
      bp.hgetall(`booking:${id}`);
    }
    const results = await bp.exec<(Record<string, string> | null)[]>();
    for (let i = 0; i < uniqueIds.length; i++) {
      const data = results[i];
      if (data) bookingMap[uniqueIds[i]] = data;
    }
  }

  const slots = await Promise.all(pairs.map(async ({ date, hour }, idx) => {
    const bookingId = bookingIds[idx];
    const eventBlockId = eventBlocks[idx] as string | null;
    const isEventBlocked = !!eventBlockId;
    let status: "available" | "mine" | "booked" | "event" | "past" | "lunch";
    let outBookingId: string | undefined;
    let outEventTitle: string | undefined;

    if (isPastSlot(date, hour)) {
      status = "past";
    } else if (LUNCH_HOURS.includes(hour)) {
      status = "lunch";
    } else if (isEventBlocked) {
      status = "event";
      outEventTitle = eventBlockId ? (await redis.hget<string>(`event:${eventBlockId}`, "title")) ?? "Club Event" : "Club Event";
    } else if (bookingId && bookingMap[bookingId]) {
      const b = bookingMap[bookingId];
      if (b.email === session.email) {
        status = "mine";
        outBookingId = bookingId;
      } else {
        status = "booked";
      }
    } else {
      status = "available";
    }

    return { date, hour, status, bookingId: outBookingId, eventTitle: outEventTitle };
  }));

  return NextResponse.json({ slots });
}
