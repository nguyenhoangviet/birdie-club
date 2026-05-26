"use client";

import { useState, useEffect, useCallback } from "react";
import { SLOT_HOURS, LUNCH_HOURS, formatHour, formatSlotRange, isPastSlot } from "@/lib/slots";

type SlotStatus = "available" | "mine" | "booked" | "past" | "lunch";

type Slot = {
  date: string;
  hour: number;
  status: SlotStatus;
  bookingId?: string;
};

type Modal =
  | { type: "book"; date: string; hour: number }
  | { type: "cancel"; date: string; hour: number; bookingId: string }
  | null;

// ─── date helpers (no external library needed) ───────────────────────────────

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

function getMondayOf(date: Date): string {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

function formatWeekRange(start: string, end: string): string {
  const s = new Date(start + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const sLabel = s.toLocaleDateString("en-US", opts);
  const eLabel = e.toLocaleDateString("en-US", { ...opts, year: "numeric" });
  return `${sLabel} – ${eLabel}`;
}

function formatDayHeader(dateStr: string): { weekday: string; day: string } {
  const d = new Date(dateStr + "T12:00:00");
  return {
    weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
    day: String(d.getDate()),
  };
}

function formatModalDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

const STATUS_CLASSES: Record<SlotStatus, string> = {
  available:
    "bg-green-100 hover:bg-green-200 text-green-800 border border-green-200 cursor-pointer",
  mine: "bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-300 cursor-pointer",
  booked: "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed",
  past: "bg-white text-gray-300 border border-gray-100 cursor-not-allowed",
  lunch: "bg-amber-50 text-amber-400 border border-amber-100 cursor-not-allowed",
};

const STATUS_LABELS: Record<SlotStatus, string> = {
  available: "Available",
  mine: "My Session",
  booked: "Taken",
  past: "–",
  lunch: "Lunch",
};

const STATUS_LABELS_COMPACT: Record<SlotStatus, string> = {
  available: "Open",
  mine: "Mine",
  booked: "Full",
  past: "–",
  lunch: "Lunch",
};

export function WeekCalendar() {
  const [weekStart, setWeekStart] = useState(() => getMondayOf(new Date()));
  const [daysToShow, setDaysToShow] = useState(7);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mobile = window.innerWidth < 768;
    if (mobile) {
      setDaysToShow(3);
      setWeekStart(todayStr());
    }
    const onResize = () => setDaysToShow(window.innerWidth < 768 ? 3 : 7);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const weekEnd = addDays(weekStart, daysToShow - 1);
  const days = Array.from({ length: daysToShow }, (_, i) => addDays(weekStart, i));
  const labels = daysToShow <= 3 ? STATUS_LABELS_COMPACT : STATUS_LABELS;
  const today = todayStr();

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/slots?from=${weekStart}&to=${weekEnd}`);
      const data = await res.json();
      setSlots(data.slots ?? []);
    } finally {
      setLoading(false);
    }
  }, [weekStart, weekEnd]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  function getSlot(date: string, hour: number): Slot | undefined {
    return slots.find((s) => s.date === date && s.hour === hour);
  }

  function getEffectiveStatus(date: string, hour: number): SlotStatus {
    if (mounted && isPastSlot(date, hour)) return "past";
    if (LUNCH_HOURS.includes(hour)) return "lunch";
    return getSlot(date, hour)?.status ?? "available";
  }

  function handleCellClick(date: string, hour: number) {
    const status = getEffectiveStatus(date, hour);
    if (status === "past" || status === "booked" || status === "lunch") return;
    setActionError("");
    const slot = getSlot(date, hour);
    if (status === "available") {
      setModal({ type: "book", date, hour });
    } else if (status === "mine" && slot?.bookingId) {
      setModal({ type: "cancel", date, hour, bookingId: slot.bookingId });
    }
  }

  async function handleBook() {
    if (!modal || modal.type !== "book") return;
    if (!name.trim()) { setActionError("Please enter your name."); return; }
    if (!phone.trim()) { setActionError("Please enter your phone number."); return; }
    setActionLoading(true);
    setActionError("");
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: modal.date, hour: modal.hour, name: name.trim(), phone: phone.trim() }),
    });
    const data = await res.json();
    setActionLoading(false);
    if (!res.ok) { setActionError(data.error ?? "Failed to book."); return; }
    setModal(null);
    setName("");
    setPhone("");
    await fetchSlots();
  }

  async function handleCancel() {
    if (!modal || modal.type !== "cancel") return;
    setActionLoading(true);
    setActionError("");
    const res = await fetch(`/api/bookings/${modal.bookingId}/cancel`, { method: "POST" });
    const data = await res.json();
    setActionLoading(false);
    if (!res.ok) { setActionError(data.error ?? "Failed to cancel."); return; }
    setModal(null);
    await fetchSlots();
  }

  function closeModal() {
    if (!actionLoading) { setModal(null); setActionError(""); setName(""); setPhone(""); }
  }

  return (
    <>
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setWeekStart(addDays(weekStart, -daysToShow))}
          className="px-3 py-2 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg shadow-sm transition-all"
        >
          ← Prev
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-semibold text-gray-700 text-center">
            {formatWeekRange(weekStart, weekEnd)}
          </span>
          <button
            onClick={() => setWeekStart(daysToShow <= 3 ? todayStr() : getMondayOf(new Date()))}
            className="text-xs text-green-600 hover:text-green-700 font-medium whitespace-nowrap"
          >
            Today
          </button>
        </div>

        <button
          onClick={() => setWeekStart(addDays(weekStart, daysToShow))}
          className="px-3 py-2 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg shadow-sm transition-all"
        >
          Next →
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4">
        {(["available", "mine", "booked", "lunch"] as SlotStatus[]).map((s) => (
          <span key={s} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className={`w-3 h-3 rounded border inline-block ${STATUS_CLASSES[s].split(" ").slice(0, 2).join(" ")}`} />
            {s === "available" ? "Available" : s === "mine" ? "My session" : s === "booked" ? "Taken" : "Lunch break"}
          </span>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="relative bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
            <span className="text-sm text-gray-500">Loading…</span>
          </div>
        )}
        <div className={daysToShow > 3 ? "overflow-x-auto" : ""}>
          <table className={`w-full border-collapse ${daysToShow > 3 ? "min-w-[560px]" : ""}`}>
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="w-16 sm:w-20 py-3 px-2 sm:px-3 text-right text-xs font-medium text-gray-400">
                  Time
                </th>
                {days.map((date) => {
                  const { weekday, day } = formatDayHeader(date);
                  const isToday = date === today;
                  return (
                    <th
                      key={date}
                      className={`py-3 px-2 text-center ${isToday ? "bg-green-50" : ""}`}
                    >
                      <div className={`text-xs font-medium ${isToday ? "text-green-600" : "text-gray-500"}`}>
                        {weekday}
                      </div>
                      <div className="mt-0.5">
                        {isToday ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-600 text-white text-sm font-bold">
                            {day}
                          </span>
                        ) : (
                          <span className="text-sm font-semibold text-gray-800">{day}</span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {SLOT_HOURS.map((hour, idx) => (
                <tr
                  key={hour}
                  className={`border-b border-gray-50 last:border-0 ${idx % 2 === 1 ? "bg-gray-50/40" : ""}`}
                >
                  <td className="py-1 sm:py-1.5 px-2 sm:px-3 text-right text-xs text-gray-400 whitespace-nowrap border-r border-gray-100 font-medium">
                    {formatHour(hour)}
                  </td>
                  {days.map((date) => {
                    const status = getEffectiveStatus(date, hour);
                    const disabled = status === "booked" || status === "past" || status === "lunch";
                    return (
                      <td key={date} className="p-0.5 sm:p-1">
                        <button
                          className={`w-full h-8 sm:h-9 rounded-lg text-xs font-medium transition-all ${STATUS_CLASSES[status]}`}
                          disabled={disabled}
                          onClick={() => handleCellClick(date, hour)}
                          title={disabled ? undefined : formatSlotRange(hour)}
                        >
                          {labels[status]}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal overlay */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {modal.type === "book" ? (
              <>
                <div className="text-center mb-4">
                  <div className="text-4xl mb-3">🏸</div>
                  <h2 className="text-xl font-bold text-gray-900">Confirm Booking</h2>
                  <p className="text-gray-500 text-sm mt-2">{formatModalDate(modal.date)}</p>
                  <p className="text-green-600 font-semibold text-lg mt-1">
                    {formatSlotRange(modal.hour)}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">1-hour coaching session</p>
                </div>
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Your name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full name"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Phone number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+84 xxx xxx xxxx"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                {actionError && (
                  <p className="text-red-500 text-sm text-center mb-4 bg-red-50 rounded-lg px-3 py-2">
                    {actionError}
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={closeModal}
                    disabled={actionLoading}
                    className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBook}
                    disabled={actionLoading}
                    className="flex-1 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 rounded-xl transition-colors"
                  >
                    {actionLoading ? "Booking…" : "Confirm"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">📅</div>
                  <h2 className="text-xl font-bold text-gray-900">Your Session</h2>
                  <p className="text-gray-500 text-sm mt-2">{formatModalDate(modal.date)}</p>
                  <p className="text-blue-600 font-semibold text-lg mt-1">
                    {formatSlotRange(modal.hour)}
                  </p>
                </div>
                {actionError && (
                  <p className="text-red-500 text-sm text-center mb-4 bg-red-50 rounded-lg px-3 py-2">
                    {actionError}
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={closeModal}
                    disabled={actionLoading}
                    className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={actionLoading}
                    className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:bg-red-300 rounded-xl transition-colors"
                  >
                    {actionLoading ? "Cancelling…" : "Cancel Session"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
