import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "adminBirdie";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body?.password || body.password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const session = await getAdminSession();
  session.isAdmin = true;
  await session.save();

  return NextResponse.json({ success: true });
}
