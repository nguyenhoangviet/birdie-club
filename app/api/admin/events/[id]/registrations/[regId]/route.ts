import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { getAdminSession } from "@/lib/session";
import { sendEventRegistrationConfirmedEmail } from "@/lib/email";

export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; regId: string }> }
) {
  const session = await getAdminSession();
  if (!session.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { regId } = await params;
  const reg = await redis.hgetall<Record<string, string>>(`eventRegistration:${regId}`);
  if (!reg || !reg.email) return NextResponse.json({ error: "Registration not found" }, { status: 404 });

  await redis.hset(`eventRegistration:${regId}`, { status: "confirmed" });

  // Send confirmation email (non-blocking)
  sendEventRegistrationConfirmedEmail(
    reg.email,
    reg.name,
    reg.eventTitle,
    reg.eventDate,
    reg.eventTime ?? "",
    Number(reg.seats)
  ).catch(console.error);

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; regId: string }> }
) {
  const session = await getAdminSession();
  if (!session.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, regId } = await params;
  const reg = await redis.hgetall<Record<string, string>>(`eventRegistration:${regId}`);
  if (!reg) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await redis.hset(`eventRegistration:${regId}`, { status: "cancelled" });

  // Decrement usedSlots counter
  const seats = Number(reg.seats) || 1;
  const ev = await redis.hgetall<Record<string, string>>(`event:${id}`);
  if (ev?.totalSlots && Number(ev.totalSlots) > 0) {
    await redis.decrby(`eventUsedSlots:${id}`, seats);
  }

  return NextResponse.json({ success: true });
}
