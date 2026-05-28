import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { getAdminSession } from "@/lib/session";
import { sendEventCancelledEmail } from "@/lib/email";
import { SLOT_HOURS } from "@/lib/slots";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ev = await redis.hgetall<Record<string, string>>(`event:${id}`);
  if (!ev || !ev.title) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  if (ev.cancelled === "1") return NextResponse.json({ error: "Already cancelled" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const reason = (body?.reason ?? "").trim();

  // Mark event as cancelled
  await redis.hset(`event:${id}`, { cancelled: "1", cancelReason: reason });

  // Remove event slot blocks if any
  if (ev.blockBookings === "1" && ev.date && ev.startTime && ev.endTime) {
    const startHour = parseInt(ev.startTime.split(":")[0], 10);
    const endHour = parseInt(ev.endTime.split(":")[0], 10);
    const blockedHours = SLOT_HOURS.filter((h) => h >= startHour && h < endHour);
    await Promise.all(blockedHours.map((h) => redis.del(`eventBlock:${ev.date}:${h}`)));
  }

  // Fetch all non-cancelled registrations and email them
  const regIds = (await redis.zrange(`eventRegs:${id}`, 0, -1)) as string[];
  const regs = (
    await Promise.all(regIds.map((rid) => redis.hgetall<Record<string, string>>(`eventRegistration:${rid}`)))
  ).filter((r): r is Record<string, string> => !!r && r.status !== "cancelled");

  // Mark all as cancelled
  await Promise.all(regs.map((r) => redis.hset(`eventRegistration:${r.id}`, { status: "cancelled" })));

  // Send emails (non-blocking)
  for (const r of regs) {
    sendEventCancelledEmail(r.email, r.name, ev.title, ev.date, reason).catch(console.error);
  }

  return NextResponse.json({ success: true, emailsSent: regs.length });
}
