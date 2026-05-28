import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
import { redis } from "@/lib/redis";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  const session = await getAdminSession();
  if (!session.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email } = await params;
  const decoded = decodeURIComponent(email);

  await redis.del(`member:${decoded}`);
  await redis.zrem("members", decoded);

  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  const session = await getAdminSession();
  if (!session.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email } = await params;
  const decoded = decodeURIComponent(email);

  const body = await req.json().catch(() => null);
  const updates: Record<string, string> = {};
  if (body?.name !== undefined) updates.name = String(body.name).trim();
  if (body?.phone !== undefined) updates.phone = String(body.phone).trim();

  if (Object.keys(updates).length > 0) {
    await redis.hset(`member:${decoded}`, updates);
  }

  return NextResponse.json({ success: true });
}
