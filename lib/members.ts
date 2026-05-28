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
