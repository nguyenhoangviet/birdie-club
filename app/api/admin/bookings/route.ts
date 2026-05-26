import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { getAdminSession } from "@/lib/session";

export async function GET() {
  const session = await getAdminSession();
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Scan all booking:* keys
  let cursor = 0;
  const allKeys: string[] = [];
  do {
    const [nextCursor, keys] = await redis.scan(cursor, {
      match: "booking:*",
      count: 100,
    });
    cursor = Number(nextCursor);
    allKeys.push(...(keys as string[]));
  } while (cursor !== 0);

  const bookings = (
    await Promise.all(
      allKeys.map((key) => redis.hgetall<Record<string, string>>(key))
    )
  ).filter(Boolean) as Array<Record<string, string>>;

  // Sort by date asc, then hour asc
  bookings.sort((a, b) => {
    const dc = (a.date ?? "").localeCompare(b.date ?? "");
    if (dc !== 0) return dc;
    return Number(a.hour ?? 0) - Number(b.hour ?? 0);
  });

  return NextResponse.json({ bookings });
}
