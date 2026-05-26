"use client";

import { useState, useEffect, useCallback } from "react";
import { formatSlotRange } from "@/lib/slots";

type AdminBooking = {
  id: string;
  email: string;
  date: string;
  hour: number;
  status: "pending" | "confirmed";
  createdAt: string;
};

function formatDisplayDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type CancelModal = { bookingId: string; email: string; date: string; hour: number } | null;

export function AdminDashboard() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [cancelModal, setCancelModal] = useState<CancelModal>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/bookings");
      const data = await res.json();
      setBookings(data.bookings ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  async function handleConfirm(id: string) {
    setActionLoading(id);
    setError("");
    const res = await fetch(`/api/admin/bookings/${id}/confirm`, { method: "POST" });
    const data = await res.json();
    setActionLoading(null);
    if (!res.ok) {
      setError(data.error ?? "Failed to confirm booking.");
      return;
    }
    await fetchBookings();
  }

  function openCancelModal(booking: AdminBooking) {
    setCancelModal({ bookingId: booking.id, email: booking.email, date: booking.date, hour: booking.hour });
    setCancelReason("");
    setCancelError("");
  }

  async function handleCancelSubmit() {
    if (!cancelModal) return;
    if (!cancelReason.trim()) {
      setCancelError("Please provide a reason for cancellation.");
      return;
    }
    setActionLoading(cancelModal.bookingId);
    setCancelError("");
    const res = await fetch(`/api/admin/bookings/${cancelModal.bookingId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: cancelReason.trim() }),
    });
    const data = await res.json();
    setActionLoading(null);
    if (!res.ok) {
      setCancelError(data.error ?? "Failed to cancel booking.");
      return;
    }
    setCancelModal(null);
    await fetchBookings();
  }

  const pending = bookings.filter((b) => b.status === "pending");
  const confirmed = bookings.filter((b) => b.status === "confirmed");

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {/* Pending bookings */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Pending Approval</h2>
          {pending.length > 0 && (
            <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {pending.length}
            </span>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
            Loading…
          </div>
        ) : pending.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
            No pending bookings.
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-xl border border-amber-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <p className="font-semibold text-gray-900">{formatDisplayDate(b.date)}</p>
                  <p className="text-amber-600 font-medium text-sm mt-0.5">{formatSlotRange(b.hour)}</p>
                  <p className="text-gray-500 text-xs mt-1">{b.email}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleConfirm(b.id)}
                    disabled={actionLoading === b.id}
                    className="text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 px-4 py-2 rounded-lg transition-colors"
                  >
                    {actionLoading === b.id ? "Confirming…" : "Confirm"}
                  </button>
                  <button
                    onClick={() => openCancelModal(b)}
                    disabled={actionLoading === b.id}
                    className="text-sm font-medium text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Confirmed upcoming bookings */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Upcoming Confirmed</h2>
          {confirmed.length > 0 && (
            <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {confirmed.length}
            </span>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
            Loading…
          </div>
        ) : confirmed.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
            No confirmed upcoming sessions.
          </div>
        ) : (
          <div className="space-y-3">
            {confirmed.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <p className="font-semibold text-gray-900">{formatDisplayDate(b.date)}</p>
                  <p className="text-green-600 font-medium text-sm mt-0.5">{formatSlotRange(b.hour)}</p>
                  <p className="text-gray-500 text-xs mt-1">{b.email}</p>
                </div>
                <button
                  onClick={() => openCancelModal(b)}
                  disabled={actionLoading === b.id}
                  className="shrink-0 text-sm font-medium text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Cancel modal */}
      {cancelModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => { if (!actionLoading) { setCancelModal(null); setCancelReason(""); } }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5">
              <h2 className="text-xl font-bold text-gray-900">Cancel Booking</h2>
              <p className="text-gray-500 text-sm mt-1">
                {formatDisplayDate(cancelModal.date)} · {formatSlotRange(cancelModal.hour)}
              </p>
              <p className="text-gray-400 text-xs mt-0.5">{cancelModal.email}</p>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for cancellation <span className="text-red-500">*</span>
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Provide a reason — this will be emailed to the member."
              rows={3}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
            />
            {cancelError && (
              <p className="text-red-500 text-xs mt-2">{cancelError}</p>
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setCancelModal(null); setCancelReason(""); }}
                disabled={!!actionLoading}
                className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCancelSubmit}
                disabled={!!actionLoading}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:bg-red-300 rounded-xl transition-colors"
              >
                {actionLoading ? "Cancelling…" : "Cancel & Notify"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
