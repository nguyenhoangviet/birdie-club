import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { sendOtpEmail } from "@/lib/email";

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = (body?.email ?? "").trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const code = generateOtp();
  // SET with 10-min TTL — atomically replaces any previous OTP
  await redis.set(`otp:${email}`, code, { ex: 600 });

  await sendOtpEmail(email, code);

  return NextResponse.json({ success: true });
}
