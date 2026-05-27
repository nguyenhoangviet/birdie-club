"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Activity {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  flickrUrl?: string;
  createdAt: string;
}

interface ClubEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  imageUrl?: string;
  flickrUrl?: string;
}

type Tab = "bookings" | "events" | "activities";

export default function AdminDashboard({
  initialActivities,
  initialEvents,
}: {
  initialActivities: Activity[];
  initialEvents: ClubEvent[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("events");

  // Activities state
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [flickrUrl, setFlickrUrl] = useState("");
  const [actTitle, setActTitle] = useState("");
  const [actDesc, setActDesc] = useState("");
  const [actLoading, setActLoading] = useState(false);
  const [actError, setActError] = useState("");
  const [actSuccess, setActSuccess] = useState("");

  // Bookings state
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  async function loadBookings() {
    if (bookings !== null) return;
    setBookingsLoading(true);
    const res = await fetch("/api/admin/bookings");
    const data = await res.json().catch(() => ({ bookings: [] }));
    setBookings(data.bookings ?? []);
    setBookingsLoading(false);
  }

  // Events state
  const [events, setEvents] = useState<ClubEvent[]>(initialEvents);
  const [evTitle, setEvTitle] = useState("");
  const [evDate, setEvDate] = useState("");
  const [evTime, setEvTime] = useState("");
  const [evLocation, setEvLocation] = useState("");
  const [evDesc, setEvDesc] = useState("");
  const [evFlickrUrl, setEvFlickrUrl] = useState("");
  const [evLoading, setEvLoading] = useState(false);
  const [evError, setEvError] = useState("");
  const [evSuccess, setEvSuccess] = useState("");

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  async function handleAddActivity(e: React.FormEvent) {
    e.preventDefault();
    setActLoading(true);
    setActError("");
    setActSuccess("");
    const res = await fetch("/api/admin/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flickrUrl, title: actTitle, description: actDesc }),
    });
    setActLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setActError(data.error ?? "Failed to add");
      return;
    }
    setFlickrUrl(""); setActTitle(""); setActDesc("");
    setActSuccess("Photo added!");
    router.refresh();
  }

  async function handleDeleteActivity(id: string) {
    if (!confirm("Delete this photo?")) return;
    await fetch(`/api/admin/activities/${id}`, { method: "DELETE" });
    setActivities((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleAddEvent(e: React.FormEvent) {
    e.preventDefault();
    setEvLoading(true);
    setEvError("");
    setEvSuccess("");
    const res = await fetch("/api/admin/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: evTitle, date: evDate, time: evTime, location: evLocation, description: evDesc, flickrUrl: evFlickrUrl }),
    });
    setEvLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setEvError(data.error ?? "Failed to add");
      return;
    }
    setEvTitle(""); setEvDate(""); setEvTime(""); setEvLocation(""); setEvDesc(""); setEvFlickrUrl("");
    setEvSuccess("Event added!");
    router.refresh();
  }

  async function handleDeleteEvent(id: string) {
    if (!confirm("Delete this event?")) return;
    await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
    setEvents((prev) => prev.filter((ev) => ev.id !== id));
  }

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
      tab === t ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-gray-900">
            <span className="text-2xl">🏸</span>
            <span>Admin Panel</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">View site</Link>
            <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">Sign out</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex gap-2 mb-8 flex-wrap">
          <button className={tabClass("bookings")} onClick={() => { setTab("bookings"); loadBookings(); }}>📋 Bookings</button>
          <button className={tabClass("events")} onClick={() => setTab("events")}>📅 Events</button>
          <button className={tabClass("activities")} onClick={() => setTab("activities")}>📸 Club Photos</button>
        </div>

        {tab === "bookings" && (
          <BookingsView bookings={bookings} loading={bookingsLoading} />
        )}

        {tab === "events" && (
          <>
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-5">Add New Event</h2>
              <form onSubmit={handleAddEvent} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-400">*</span></label>
                    <input type="text" value={evTitle} onChange={e => setEvTitle(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g. Beginner's Coaching Workshop" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-400">*</span></label>
                    <input type="date" value={evDate} onChange={e => setEvDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <input type="text" value={evTime} onChange={e => setEvTime(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g. 9:00 AM – 11:00 AM" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input type="text" value={evLocation} onChange={e => setEvLocation(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g. Court 3, Birdie Club Hall" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea value={evDesc} onChange={e => setEvDesc(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                      rows={3} placeholder="What's this event about?" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Photo (Flickr URL)</label>
                    <input type="url" value={evFlickrUrl} onChange={e => setEvFlickrUrl(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="https://www.flickr.com/photos/user/12345678/" />
                    <p className="text-xs text-gray-400 mt-1">Paste a Flickr photo page URL — image is fetched automatically.</p>
                  </div>
                </div>
                {evError && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{evError}</p>}
                {evSuccess && <p className="text-green-600 text-sm bg-green-50 px-3 py-2 rounded-lg">{evSuccess}</p>}
                <button type="submit" disabled={evLoading}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50">
                  {evLoading ? "Adding…" : "Add Event"}
                </button>
              </form>
            </div>

            <h2 className="text-lg font-bold text-gray-900 mb-4">All Events <span className="text-gray-400 font-normal text-base">({events.length})</span></h2>
            {events.length === 0 ? (
              <div className="text-center py-14 bg-white rounded-2xl border border-gray-200 text-gray-400">No events yet.</div>
            ) : (
              <div className="space-y-3">
                {[...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(ev => (
                  <div key={ev.id} className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-start justify-between gap-4 shadow-sm">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{ev.title}</p>
                      <p className="text-green-600 text-xs mt-0.5">
                        {new Date(ev.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        {ev.time && ` · ${ev.time}`}
                      </p>
                      {ev.location && <p className="text-gray-400 text-xs mt-0.5">📍 {ev.location}</p>}
                      {ev.description && <p className="text-gray-500 text-xs mt-1 line-clamp-1">{ev.description}</p>}
                    </div>
                    <button onClick={() => handleDeleteEvent(ev.id)} className="text-xs text-red-400 hover:text-red-600 font-medium flex-shrink-0">Delete</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "activities" && (
          <>
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-5">Add Club Photo</h2>
              <form onSubmit={handleAddActivity} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-400">*</span></label>
                  <input type="text" value={actTitle} onChange={e => setActTitle(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g. Group Coaching – May 2026" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Flickr Photo URL</label>
                  <input type="url" value={flickrUrl} onChange={e => setFlickrUrl(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="https://www.flickr.com/photos/user/12345678/" />
                  <p className="text-xs text-gray-400 mt-1">Paste a Flickr photo page URL — image is fetched automatically.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
                  <textarea value={actDesc} onChange={e => setActDesc(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    rows={2} placeholder="Short caption…" />
                </div>
                {actError && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{actError}</p>}
                {actSuccess && <p className="text-green-600 text-sm bg-green-50 px-3 py-2 rounded-lg">{actSuccess}</p>}
                <button type="submit" disabled={actLoading}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50">
                  {actLoading ? "Adding…" : "Add Photo"}
                </button>
              </form>
            </div>

            <h2 className="text-lg font-bold text-gray-900 mb-4">Club Photos <span className="text-gray-400 font-normal text-base">({activities.length})</span></h2>
            {activities.length === 0 ? (
              <div className="text-center py-14 bg-white rounded-2xl border border-gray-200 text-gray-400">No photos yet.</div>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {activities.map(a => (
                  <div key={a.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    {a.imageUrl ? (
                      <img src={a.imageUrl} alt={a.title} className="w-full h-44 object-cover" />
                    ) : (
                      <div className="h-44 bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center">
                        <span className="text-white text-4xl">🏸</span>
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 text-sm leading-snug">{a.title}</h3>
                      {a.description && <p className="text-gray-500 text-xs mt-1 line-clamp-2">{a.description}</p>}
                      <div className="flex items-center justify-between mt-3">
                        {a.flickrUrl ? (
                          <a href={a.flickrUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 text-xs hover:underline">Flickr →</a>
                        ) : <span />}
                        <button onClick={() => handleDeleteActivity(a.id)} className="text-xs text-red-400 hover:text-red-600 font-medium">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ── Bookings View ─────────────────────────────────────────────────────────────

interface Booking {
  id: string;
  email: string;
  date: string;
  hour: string;
  name: string;
  phone: string;
  status: string;
}

function BookingsView({
  bookings,
  loading,
}: {
  bookings: Booking[] | null;
  loading: boolean;
}) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [cancelOpenId, setCancelOpenId] = useState<string | null>(null);
  const [cancelReasons, setCancelReasons] = useState<Record<string, string>>({});
  const [localBookings, setLocalBookings] = useState<Booking[] | null>(bookings);

  // Sync when prop changes (initial load)
  if (bookings !== null && localBookings === null) {
    setLocalBookings(bookings);
  }

  async function handleConfirm(id: string) {
    setConfirming(id);
    const res = await fetch(`/api/admin/bookings/${id}/confirm`, { method: "POST" });
    setConfirming(null);
    if (res.ok) {
      setLocalBookings((prev) =>
        prev ? prev.map((b) => (b.id === id ? { ...b, status: "confirmed" } : b)) : prev
      );
    }
  }

  async function handleCancel(id: string) {
    const reason = cancelReasons[id] ?? "";
    setCancelling(id);
    const res = await fetch(`/api/admin/bookings/${id}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    setCancelling(null);
    if (res.ok) {
      setCancelOpenId(null);
      setLocalBookings((prev) =>
        prev ? prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)) : prev
      );
    }
  }

  if (loading) {
    return <div className="text-center py-16 text-gray-400">Loading bookings…</div>;
  }

  if (!localBookings) return null;

  const active = localBookings.filter((b) => b.status !== "cancelled");
  const cancelled = localBookings.filter((b) => b.status === "cancelled");
  const pending = active.filter((b) => b.status === "pending");

  if (localBookings.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 text-gray-400">
        No bookings yet.
      </div>
    );
  }

  function renderBooking(b: Booking) {
    const h = Number(b.hour);
    const time = `${String(h).padStart(2, "0")}:00 – ${String(h + 1).padStart(2, "0")}:00`;
    const isPending = b.status === "pending";
    const isCancelled = b.status === "cancelled";
    const isPast = !isCancelled && new Date(`${b.date}T${String(h + 1).padStart(2, "0")}:00:00`) < new Date();
    const cancelOpen = cancelOpenId === b.id;

    return (
      <div
        key={b.id}
        className={`bg-white rounded-xl border px-5 py-4 ${isCancelled || isPast ? "opacity-50 border-gray-100" : isPending ? "border-amber-300 shadow-sm" : "border-gray-200"}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <span className={`font-bold text-sm shrink-0 w-32 ${isPast ? "text-gray-400" : "text-green-700"}`}>{time}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-900 text-sm">{b.name}</p>
              {isPending && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  ⏳ Pending
                </span>
              )}
              {b.status === "confirmed" && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                  ✓ Confirmed
                </span>
              )}
              {isCancelled && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-500">
                  ✕ Cancelled
                </span>
              )}
            </div>
            <p className="text-gray-400 text-xs truncate">{b.email}</p>
            <p className="text-gray-500 text-xs">{b.phone}</p>
          </div>
          {!isCancelled && !isPast && (
            <div className="flex items-center gap-2 shrink-0">
              {isPending && (
                <button
                  onClick={() => handleConfirm(b.id)}
                  disabled={confirming === b.id}
                  className="text-xs font-semibold bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {confirming === b.id ? "Confirming…" : "✓ Confirm"}
                </button>
              )}
              <button
                onClick={() => setCancelOpenId(cancelOpen ? null : b.id)}
                className="text-xs font-semibold text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {cancelOpen && !isPast && (
          <div className="mt-3 flex gap-2 items-center">
            <input
              type="text"
              value={cancelReasons[b.id] ?? ""}
              onChange={(e) =>
                setCancelReasons((prev) => ({ ...prev, [b.id]: e.target.value }))
              }
              placeholder="Reason for cancellation (optional)"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <button
              onClick={() => handleCancel(b.id)}
              disabled={cancelling === b.id}
              className="text-xs font-semibold bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 shrink-0"
            >
              {cancelling === b.id ? "Cancelling…" : "Confirm Cancel"}
            </button>
            <button
              onClick={() => setCancelOpenId(null)}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    );
  }

  // Group active bookings by date
  const grouped: Record<string, Booking[]> = {};
  for (const b of active) {
    if (!grouped[b.date]) grouped[b.date] = [];
    grouped[b.date].push(b);
  }
  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="space-y-6">
      <div className="flex gap-3 text-sm text-gray-500 flex-wrap">
        <span>{localBookings.length} total</span>
        {pending.length > 0 && (
          <span className="text-amber-600 font-medium">· {pending.length} awaiting confirmation</span>
        )}
      </div>

      {sortedDates.map((date) => (
        <div key={date}>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {new Date(date + "T00:00:00").toLocaleDateString("en-GB", {
              weekday: "long", day: "numeric", month: "long", year: "numeric",
            })}
          </h3>
          <div className="space-y-2">
            {grouped[date]
              .sort((a, b) => Number(a.hour) - Number(b.hour))
              .map(renderBooking)}
          </div>
        </div>
      ))}

      {cancelled.length > 0 && (
        <details className="mt-4">
          <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-600">
            Show {cancelled.length} cancelled booking{cancelled.length !== 1 ? "s" : ""}
          </summary>
          <div className="space-y-2 mt-2">{cancelled.map(renderBooking)}</div>
        </details>
      )}
    </div>
  );
}
