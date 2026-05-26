"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type BookingItem = {
  id: string;
  date: string;
  hour: number;
  slotLabel: string;
  canCancel: boolean;
  status: "pending" | "confirmed";
};

function formatDisplayDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function BookingList({
  upcoming,
  past,
  pending,
}: {
  upcoming: BookingItem[];
  past: BookingItem[];
  pending: BookingItem[];
}) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleCancel(id: string) {
    setCancelling(id);
    setError("");
    const res = await fetch(`/api/bookings/${id}/cancel`, { method: "POST" });
    const data = await res.json();
    setCancelling(null);
    if (!res.ok) {
      setError(data.error ?? "Failed to cancel.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {/* Pending — awaiting admin confirmation */}
      {pending.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Awaiting Confirmation</h2>
            <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {pending.length}
            </span>
          </div>
          <div className="space-y-3">
            {pending.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-xl border border-amber-200 px-5 py-4 flex items-start justify-between gap-4"
              >
                <div>
                  <p className="font-semibold text-gray-900">{formatDisplayDate(b.date)}</p>
                  <p className="text-amber-600 font-medium text-sm mt-0.5">{b.slotLabel}</p>
                  <p className="text-amber-500 text-xs mt-1.5">⏳ Waiting for admin to confirm</p>
                </div>
                <button
                  onClick={() => handleCancel(b.id)}
                  disabled={cancelling === b.id}
                  className="shrink-0 text-sm font-medium text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {cancelling === b.id ? "Cancelling…" : "Cancel"}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Upcoming Sessions</h2>
          {upcoming.length > 0 && (
            <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {upcoming.length}
            </span>
          )}
        </div>

        {upcoming.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <div className="text-4xl mb-3">🏸</div>
            <p className="text-gray-500">No confirmed sessions yet.</p>
            {pending.length === 0 && (
              <Link
                href="/calendar"
                className="mt-4 inline-block bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                Book a session →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-start justify-between gap-4"
              >
                <div>
                  <p className="font-semibold text-gray-900">{formatDisplayDate(b.date)}</p>
                  <p className="text-green-600 font-medium text-sm mt-0.5">{b.slotLabel}</p>
                  {!b.canCancel && (
                    <p className="text-amber-600 text-xs mt-1.5">
                      ⚠ Cancellation unavailable — within 24 hours of session
                    </p>
                  )}
                </div>
                {b.canCancel && (
                  <button
                    onClick={() => handleCancel(b.id)}
                    disabled={cancelling === b.id}
                    className="shrink-0 text-sm font-medium text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {cancelling === b.id ? "Cancelling…" : "Cancel"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Past */}
      {past.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Past Sessions</h2>
          <div className="space-y-2">
            {past.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-center justify-between opacity-60"
              >
                <div>
                  <p className="font-medium text-gray-700">{formatDisplayDate(b.date)}</p>
                  <p className="text-gray-500 text-sm">{b.slotLabel}</p>
                </div>
                <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                  Completed
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
