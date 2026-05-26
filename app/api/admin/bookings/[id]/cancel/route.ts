import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { getSession } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";
import { sendBookingCancelledEmail } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.isLoggedIn || !isAdminEmail(session.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const body = await req.json().catch(() => null);
  const reason: string = body?.reason?.trim() ?? "";

  if (!reason) {
    return NextResponse.json({ error: "Cancellation reason is required" }, { status: 400 });
  }

  const booking = await redis.hgetall<{
    id: string;
    email: string;
    date: string;
    hour: string;
    status: string;
  }>(`booking:${id}`);

  if (!booking || (booking.status !== "pending" && booking.status !== "confirmed")) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const hourNum = Number(booking.hour);

  await redis.hset(`booking:${id}`, { status: "cancelled" });
  await redis.del(`slot:${booking.date}:${hourNum}`);

  await sendBookingCancelledEmail(booking.email, booking.date, hourNum, reason);

  return NextResponse.json({ success: true });
}
