import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = (body?.email ?? "").trim().toLowerCase();
  const code = (body?.code ?? "").trim();

  if (!email || !code) {
    return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
  }

  const stored = await redis.get<string>(`otp:${email}`);

  if (!stored || stored !== code) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
  }

  // Invalidate OTP immediately
  await redis.del(`otp:${email}`);

  const session = await getSession();
  session.email = email;
  session.isLoggedIn = true;
  await session.save();

  return NextResponse.json({ success: true });
}
