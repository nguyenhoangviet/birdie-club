import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { getAdminSession } from "@/lib/session";

export async function GET() {
  const session = await getAdminSession();
  if (!session.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let cursor = 0;
  const allKeys: string[] = [];
  do {
    const [nextCursor, keys] = await redis.scan(cursor, { match: "eventRegistration:*", count: 100 });
    cursor = Number(nextCursor);
    allKeys.push(...(keys as string[]));
  } while (cursor !== 0);

  const regs = (
    await Promise.all(allKeys.map((key) => redis.hgetall<Record<string, string>>(key)))
  ).filter(Boolean) as Array<Record<string, string>>;

  // Sort by registeredAt desc
  regs.sort((a, b) => (b.registeredAt ?? "").localeCompare(a.registeredAt ?? ""));

  return NextResponse.json({ registrations: regs });
}
