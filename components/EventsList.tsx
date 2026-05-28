"use client";

import { useState } from "react";

interface ClubEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  imageUrl?: string;
  totalSlots?: number;
  usedSlots?: number;
  cancelled?: boolean;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function RegistrationForm({ event, onClose }: { event: ClubEvent; onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const spotsLeft = event.totalSlots ? event.totalSlots - (event.usedSlots ?? 0) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch(`/api/events/${event.id}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, seats }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Registration failed. Please try again.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="mt-4 bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
        <div className="text-3xl mb-2">🎉</div>
        <p className="font-bold text-green-800 text-sm">Registration received!</p>
        <p className="text-green-700 text-xs mt-1">
          We&apos;ll confirm your spot shortly. Check your inbox for a confirmation email.
        </p>
        <button onClick={onClose} className="mt-3 text-xs text-green-600 underline hover:text-green-800">
          Close
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-3">
      <p className="font-semibold text-gray-900 text-sm mb-1">Register for this event</p>
      {spotsLeft !== null && (
        <p className={`text-xs font-medium ${spotsLeft <= 3 ? "text-orange-500" : "text-green-600"}`}>
          {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} remaining
        </p>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Full name <span className="text-red-400">*</span></label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Your name" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Email <span className="text-red-400">*</span></label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="your@email.com" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Phone (optional)</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Your phone number" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Number of seats <span className="text-red-400">*</span></label>
          <select value={seats} onChange={(e) => setSeats(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n} disabled={spotsLeft !== null && n > spotsLeft}>
                {n} {n === 1 ? "person" : "people"}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error && <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      <div className="flex items-center gap-3 pt-1">
        <button type="submit" disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors disabled:opacity-50">
          {loading ? "Submitting…" : "Register"}
        </button>
        <button type="button" onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 font-medium">
          Cancel
        </button>
      </div>
    </form>
  );
}

function EventCard({ event, isPast }: { event: ClubEvent; isPast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const hasLongDesc = (event.description?.length ?? 0) > 140;

  const totalSlots = event.totalSlots ?? 0;
  const usedSlots = event.usedSlots ?? 0;
  const isFull = totalSlots > 0 && usedSlots >= totalSlots;
  const isCancelled = event.cancelled;

  return (
    <div id={event.id} className={`bg-white rounded-2xl border overflow-hidden shadow-sm transition-all hover:shadow-md ${
      isPast || isCancelled ? "border-gray-100 opacity-55 grayscale" : "border-gray-200"
    } scroll-mt-20`}>
      {event.imageUrl && (
        <img src={event.imageUrl} alt={event.title} className="w-full h-52 object-cover" />
      )}
      <div className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {isPast && <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2.5 py-0.5 font-medium">Past</span>}
              {isCancelled && <span className="text-xs bg-red-100 text-red-600 rounded-full px-2.5 py-0.5 font-semibold">Cancelled</span>}
              {!isPast && !isCancelled && isFull && <span className="text-xs bg-orange-100 text-orange-600 rounded-full px-2.5 py-0.5 font-semibold">Full</span>}
              {!isPast && !isCancelled && !isFull && totalSlots > 0 && (
                <span className="text-xs bg-green-50 text-green-600 rounded-full px-2.5 py-0.5 font-medium">
                  {totalSlots - usedSlots} spots left
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-gray-900 leading-snug">{event.title}</h2>
            {event.description && (
              <div className="mt-2">
                <p className={`text-gray-500 text-sm leading-relaxed ${!expanded && hasLongDesc ? "line-clamp-2" : "whitespace-pre-line"}`}>
                  {event.description}
                </p>
                {hasLongDesc && (
                  <button onClick={() => setExpanded((v) => !v)}
                    className="text-green-600 text-sm font-medium mt-1 hover:underline focus:outline-none">
                    {expanded ? "Show less ↑" : "Read more ↓"}
                  </button>
                )}
              </div>
            )}
          </div>
          <div className={`flex-shrink-0 rounded-xl px-4 py-3 text-center min-w-[130px] ${
            isPast || isCancelled ? "bg-gray-50 border border-gray-100" : "bg-green-50 border border-green-100"
          }`}>
            <p className={`font-bold text-sm leading-snug ${isPast || isCancelled ? "text-gray-400" : "text-green-700"}`}>
              {formatDate(event.date)}
            </p>
            {event.time && (
              <p className={`text-sm mt-0.5 ${isPast || isCancelled ? "text-gray-400" : "text-green-600"}`}>
                🕐 {event.time}
              </p>
            )}
          </div>
        </div>
        {event.location && (
          <p className="text-gray-400 text-sm mt-3 flex items-center gap-1">
            <span>📍</span><span>{event.location}</span>
          </p>
        )}
        {!isPast && !isCancelled && (
          <div className="mt-4">
            {isFull ? (
              <span className="inline-block text-sm text-gray-400 font-medium bg-gray-100 px-4 py-2 rounded-xl">Fully booked</span>
            ) : (
              !showForm && (
                <button onClick={() => setShowForm(true)}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors">
                  Register →
                </button>
              )
            )}
            {showForm && <RegistrationForm event={event} onClose={() => setShowForm(false)} />}
          </div>
        )}
      </div>
    </div>
  );
}

export function EventsList({ upcoming, past }: { upcoming: ClubEvent[]; past: ClubEvent[] }) {
  return (
    <>
      {upcoming.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <span className="text-5xl block mb-4">📅</span>
          <p className="text-gray-400 font-medium">No upcoming events yet.</p>
          <p className="text-gray-300 text-sm mt-1">Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {upcoming.map((e) => <EventCard key={e.id} event={e} isPast={false} />)}
        </div>
      )}
      {past.length > 0 && (
        <div className="mt-12">
          <h2 className="text-base font-semibold text-gray-400 uppercase tracking-wide mb-4">Past Events</h2>
          <div className="space-y-3">
            {past.map((e) => <EventCard key={e.id} event={e} isPast={true} />)}
          </div>
        </div>
      )}
    </>
  );
}
