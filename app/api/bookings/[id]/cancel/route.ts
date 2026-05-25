import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { getSession } from "@/lib/session";
import { isWithin24Hours } from "@/lib/slots";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const booking = await redis.hgetall<{
    id: string;
    email: string;
    date: string;
    hour: string;
    status: string;
  }>(`booking:${id}`);

  if (!booking || booking.status !== "confirmed" || booking.email !== session.email) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const hourNum = Number(booking.hour);

  if (isWithin24Hours(booking.date, hourNum)) {
    return NextResponse.json(
      { error: "Cancellation is not allowed within 24 hours of the session" },
      { status: 400 }
    );
  }

  // Mark cancelled and free the slot atomically
  await redis.hset(`booking:${id}`, { status: "cancelled" });
  await redis.del(`slot:${booking.date}:${hourNum}`);

  return NextResponse.json({ success: true });
}
