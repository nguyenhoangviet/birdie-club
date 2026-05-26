import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { getAdminSession } from "@/lib/session";
import { sendBookingCancelledEmail } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const reason = (body?.reason ?? "").trim();

  const booking = await redis.hgetall<Record<string, string>>(`booking:${id}`);

  if (!booking?.id) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.status === "cancelled") {
    return NextResponse.json({ error: "Already cancelled" }, { status: 400 });
  }

  await redis.hset(`booking:${id}`, { status: "cancelled" });
  await redis.del(`slot:${booking.date}:${booking.hour}`);

  await sendBookingCancelledEmail(
    booking.email,
    booking.name ?? booking.email,
    booking.date,
    Number(booking.hour),
    reason
  );

  return NextResponse.json({ success: true });
}
