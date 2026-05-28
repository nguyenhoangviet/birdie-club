import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { getAdminSession } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const regIds = (await redis.zrange(`eventRegs:${id}`, 0, -1)) as string[];
  const regs = (
    await Promise.all(regIds.map((rid) => redis.hgetall<Record<string, string>>(`eventRegistration:${rid}`)))
  ).filter(Boolean);

  return NextResponse.json({ registrations: regs });
}
