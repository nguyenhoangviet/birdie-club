import { redis } from "./redis";
import { randomUUID } from "crypto";

export async function upsertMember(
  email: string,
  name: string,
  phone: string,
  source: "booking" | "event" | "manual"
) {
  const existing = await redis.hgetall<Record<string, string>>(`member:${email}`);
  if (!existing || !existing.id) {
    const id = randomUUID();
    await redis.hset(`member:${email}`, {
      id,
      email,
      name,
      phone,
      createdAt: new Date().toISOString(),
      source,
    });
    await redis.zadd("members", { score: Date.now(), member: email });
  } else {
    // Fill in missing name/phone if now available
    const updates: Record<string, string> = {};
    if (!existing.name && name) updates.name = name;
    if (!existing.phone && phone) updates.phone = phone;
    if (Object.keys(updates).length > 0) {
      await redis.hset(`member:${email}`, updates);
    }
  }
}

export async function syncMembersFromBookings() {
  const bookingKeys = (await redis.keys("userBookings:*")) as string[];

  await Promise.all(
    bookingKeys.map(async (key) => {
      const email = key.replace("userBookings:", "");
      const existing = await redis.hgetall<Record<string, string>>(`member:${email}`);
      if (existing && existing.id) return;

      const [latestId] = (await redis.zrange(key, 0, 0, { rev: true })) as string[];
      if (!latestId) return;

      const booking = await redis.hgetall<Record<string, string>>(`booking:${latestId}`);
      if (!booking) return;

      await upsertMember(email, booking.name ?? "", booking.phone ?? "", "booking");
    })
  );
}

export async function listMembers() {
  const emails = (await redis.zrange("members", 0, -1, { rev: true })) as string[];
  const members = (
    await Promise.all(emails.map((email) => redis.hgetall<Record<string, string>>(`member:${email}`)))
  ).filter((member) => Boolean(member && member.id)) as Array<Record<string, string>>;

  return members;
}
