import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { getSession } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";
import { sendBookingConfirmedEmail } from "@/lib/email";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.isLoggedIn || !isAdminEmail(session.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const booking = await redis.hgetall<{
    id: string;
    email: string;
    date: string;
    hour: string;
    status: string;
  }>(`booking:${id}`);

  if (!booking || booking.status !== "pending") {
    return NextResponse.json({ error: "Booking not found or not pending" }, { status: 404 });
  }

  await redis.hset(`booking:${id}`, { status: "confirmed" });

  await sendBookingConfirmedEmail(booking.email, booking.date, Number(booking.hour));

  return NextResponse.json({ success: true });
}
