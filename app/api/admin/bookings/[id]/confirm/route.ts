import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { getAdminSession } from "@/lib/session";
import { sendBookingConfirmedEmail } from "@/lib/email";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const booking = await redis.hgetall<Record<string, string>>(`booking:${id}`);

  if (!booking?.id) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.status !== "pending") {
    return NextResponse.json({ error: "Booking is not pending" }, { status: 400 });
  }

  await redis.hset(`booking:${id}`, { status: "confirmed" });

  await sendBookingConfirmedEmail(
    booking.email,
    booking.name ?? booking.email,
    booking.date,
    Number(booking.hour)
  );

  return NextResponse.json({ success: true });
}
