// Slots run 8 AM – 8 PM: hours 8 through 19 (each slot is 1 hour)
export const SLOT_HOURS: number[] = Array.from({ length: 12 }, (_, i) => i + 8);

export function formatHour(hour: number): string {
  if (hour === 12) return "12:00 PM";
  if (hour < 12) return `${hour}:00 AM`;
  return `${hour - 12}:00 PM`;
}

export function formatSlotRange(hour: number): string {
  return `${formatHour(hour)} – ${formatHour(hour + 1)}`;
}

/** Returns true if the slot start time is already in the past */
export function isPastSlot(date: string, hour: number): boolean {
  const slotTime = new Date(`${date}T${String(hour).padStart(2, "0")}:00:00`);
  return slotTime < new Date();
}

/** Returns true if the slot is within 24 hours from now (cancellation window) */
export function isWithin24Hours(date: string, hour: number): boolean {
  const slotTime = new Date(`${date}T${String(hour).padStart(2, "0")}:00:00`);
  const diffMs = slotTime.getTime() - Date.now();
  return diffMs < 24 * 60 * 60 * 1000;
}
