import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
import { redis } from "@/lib/redis";
import { sendOutreachEmail } from "@/lib/email";
import { randomUUID } from "crypto";

export async function GET() {
  const session = await getAdminSession();
  if (!session.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ids = (await redis.zrange("campaigns", 0, -1, { rev: true })) as string[];
  const campaigns = (
    await Promise.all(ids.map((id) => redis.hgetall<Record<string, string>>(`campaign:${id}`)))
  ).filter(Boolean) as Array<Record<string, string>>;

  return NextResponse.json({ campaigns });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { eventId, recipients, message } = body ?? {};

  if (!eventId || !Array.isArray(recipients) || recipients.length === 0) {
    return NextResponse.json({ error: "Event and at least one recipient are required" }, { status: 400 });
  }

  // Validate recipients are strings
  const recipientEmails: string[] = recipients
    .map((r: unknown) => (typeof r === "string" ? r.trim().toLowerCase() : ""))
    .filter(Boolean);

  if (recipientEmails.length === 0) {
    return NextResponse.json({ error: "No valid recipient emails" }, { status: 400 });
  }

  // Load event data
  const ev = await redis.hgetall<Record<string, string>>(`event:${eventId}`);
  if (!ev || !ev.title) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Load member names for personalization
  const memberData = await Promise.all(
    recipientEmails.map((email) => redis.hgetall<Record<string, string>>(`member:${email}`))
  );

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://birdie-club-rose.vercel.app";
  const sentAt = new Date().toISOString();
  let sentCount = 0;
  const eventTime = ev.time ?? (ev.startTime && ev.endTime ? `${ev.startTime} - ${ev.endTime}` : "");

  // Send emails
  await Promise.all(
    recipientEmails.map(async (email, idx) => {
      const member = memberData[idx];
      const name = member?.name ?? email;
      try {
        await sendOutreachEmail(
          email,
          name,
          eventId,
          ev.title,
          ev.date,
          eventTime,
          (message ?? "").trim(),
          siteUrl
        );
        sentCount++;
      } catch (err) {
        console.error(`[Outreach] Failed to send to ${email}:`, err);
      }
    })
  );

  if (sentCount === 0) {
    return NextResponse.json(
      { error: "No invitation emails were delivered. Please check email settings and try again." },
      { status: 502 }
    );
  }

  // Save campaign record
  const id = randomUUID();
  await redis.hset(`campaign:${id}`, {
    id,
    eventId,
    eventTitle: ev.title,
    eventDate: ev.date,
    message: (message ?? "").trim(),
    sentAt,
    sentCount: String(sentCount),
    recipients: JSON.stringify(recipientEmails),
  });
  await redis.zadd("campaigns", { score: Date.now(), member: id });

  return NextResponse.json({ success: true, sentCount, campaignId: id, recipientCount: recipientEmails.length });
}
