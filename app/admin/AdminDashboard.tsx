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
  startTime?: string;
  endTime?: string;
  location?: string;
  description?: string;
  imageUrl?: string;
  flickrUrl?: string;
  totalSlots?: string;
  usedSlots?: string;
  blockBookings?: string;
  cancelled?: string;
  cancelReason?: string;
}

interface EventRegistration {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime?: string;
  email: string;
  name: string;
  phone?: string;
  seats: string;
  status: string;
  registeredAt: string;
}

interface SlideConfig {
  title: string;
  sub: string;
  imageUrl?: string;
  flickrUrl?: string;
  gradient: string;
}

interface Member {
  id: string;
  email: string;
  name: string;
  phone?: string;
  source: string;
  createdAt: string;
}

interface Campaign {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  message?: string;
  sentAt: string;
  sentCount: string;
  recipients: string;
}

type Tab = "bookings" | "events" | "activities" | "slider" | "members" | "outreach";

export default function AdminDashboard({
  initialActivities,
  initialEvents,
  initialSlides,
  initialFeaturedEventId,
  initialEventDuration,
  initialMembers,
  initialCampaigns,
}: {
  initialActivities: Activity[];
  initialEvents: ClubEvent[];
  initialSlides: SlideConfig[];
  initialFeaturedEventId: string;
  initialEventDuration: number;
  initialMembers: Member[];
  initialCampaigns: Campaign[];
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
    const [bookRes, regRes] = await Promise.all([
      fetch("/api/admin/bookings"),
      fetch("/api/admin/registrations"),
    ]);
    const bookData = await bookRes.json().catch(() => ({ bookings: [] }));
    const regData = await regRes.json().catch(() => ({ registrations: [] }));
    setBookings(bookData.bookings ?? []);
    setRegistrations(regData.registrations ?? []);
    setBookingsLoading(false);
  }

  // Events state
  const [events, setEvents] = useState<ClubEvent[]>(initialEvents);
  const [evTitle, setEvTitle] = useState("");
  const [evDate, setEvDate] = useState("");
  const [evStartTime, setEvStartTime] = useState("");
  const [evEndTime, setEvEndTime] = useState("");
  const [evLocation, setEvLocation] = useState("");
  const [evDesc, setEvDesc] = useState("");
  const [evFlickrUrl, setEvFlickrUrl] = useState("");
  const [evTotalSlots, setEvTotalSlots] = useState(0);
  const [evBlockBookings, setEvBlockBookings] = useState(false);
  const [evLoading, setEvLoading] = useState(false);
  const [evError, setEvError] = useState("");
  const [evSuccess, setEvSuccess] = useState("");
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [cancellingEventId, setCancellingEventId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  // Event registrations (for Bookings tab)
  const [registrations, setRegistrations] = useState<EventRegistration[] | null>(null);

  // Per-event registrations (Events tab inline panel)
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [eventRegs, setEventRegs] = useState<Record<string, EventRegistration[]>>({});
  const [eventRegsLoading, setEventRegsLoading] = useState<string | null>(null);

  async function toggleEventRegistrants(id: string) {
    if (expandedEventId === id) { setExpandedEventId(null); return; }
    setExpandedEventId(id);
    if (eventRegs[id]) return;
    setEventRegsLoading(id);
    const res = await fetch(`/api/admin/events/${id}/registrations`);
    const data = await res.json().catch(() => ({ registrations: [] }));
    setEventRegs((prev) => ({ ...prev, [id]: data.registrations ?? [] }));
    setEventRegsLoading(null);
  }

  async function handleConfirmEventReg(regId: string, eventId: string) {
    await fetch(`/api/admin/events/${eventId}/registrations/${regId}`, { method: "PUT" });
    setEventRegs((prev) => ({
      ...prev,
      [eventId]: (prev[eventId] ?? []).map((r) => r.id === regId ? { ...r, status: "confirmed" } : r),
    }));
  }

  async function handleCancelEventReg(regId: string, eventId: string) {
    if (!confirm("Cancel this registration?")) return;
    await fetch(`/api/admin/events/${eventId}/registrations/${regId}`, { method: "DELETE" });
    setEventRegs((prev) => ({
      ...prev,
      [eventId]: (prev[eventId] ?? []).map((r) => r.id === regId ? { ...r, status: "cancelled" } : r),
    }));
  }

  // Featured event (slider pin)
  const [featuredEventId, setFeaturedEventId] = useState<string>(initialFeaturedEventId);
  const [pinLoading, setPinLoading] = useState<string | null>(null);

  // Slider state
  const [slides, setSlides] = useState<SlideConfig[]>(initialSlides);
  const [eventDuration, setEventDuration] = useState(initialEventDuration);
  const [eventDurLoading, setEventDurLoading] = useState(false);
  const [eventDurError, setEventDurError] = useState("");
  const [eventDurSuccess, setEventDurSuccess] = useState("");
  const [slideEditing, setSlideEditing] = useState<number | null>(null);
  const [slideTitle, setSlideTitle] = useState("");
  const [slideSub, setSlideSub] = useState("");
  const [slideFlickrUrl, setSlideFlickrUrl] = useState("");
  const [slideLoading, setSlideLoading] = useState(false);
  const [slideError, setSlideError] = useState("");
  const [slideSuccess, setSlideSuccess] = useState("");

  // Members state
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [memName, setMemName] = useState("");
  const [memEmail, setMemEmail] = useState("");
  const [memPhone, setMemPhone] = useState("");
  const [memLoading, setMemLoading] = useState(false);
  const [memError, setMemError] = useState("");
  const [memSuccess, setMemSuccess] = useState("");
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Outreach / Campaigns state
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [outreachEventId, setOutreachEventId] = useState("");
  const [outreachRecipients, setOutreachRecipients] = useState<Set<string>>(new Set());
  const [outreachMessage, setOutreachMessage] = useState("");
  const [outreachLoading, setOutreachLoading] = useState(false);
  const [outreachError, setOutreachError] = useState("");
  const [outreachSuccess, setOutreachSuccess] = useState("");

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

  function handleStartEdit(ev: ClubEvent) {
    setEditingEventId(ev.id);
    setEvTitle(ev.title);
    setEvDate(ev.date);
    // Parse startTime/endTime from stored fields or from time string
    const st = ev.startTime ?? (ev.time?.split(" - ")[0] ?? "");
    const et = ev.endTime ?? (ev.time?.split(" - ")[1] ?? "");
    setEvStartTime(st);
    setEvEndTime(et);
    setEvLocation(ev.location ?? "");
    setEvDesc(ev.description ?? "");
    setEvFlickrUrl(ev.flickrUrl ?? "");
    setEvTotalSlots(Number(ev.totalSlots) || 0);
    setEvBlockBookings(ev.blockBookings === "1");
    setEvError("");
    setEvSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setEditingEventId(null);
    setEvTitle(""); setEvDate(""); setEvStartTime(""); setEvEndTime("");
    setEvLocation(""); setEvDesc(""); setEvFlickrUrl("");
    setEvTotalSlots(0); setEvBlockBookings(false);
    setEvError(""); setEvSuccess("");
  }

  async function handlePinEvent(id: string) {
    setPinLoading(id);
    await fetch("/api/admin/slider/featured", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: id }),
    });
    setFeaturedEventId(id);
    setPinLoading(null);
  }

  async function handleUnpinEvent() {
    setPinLoading("unpin");
    await fetch("/api/admin/slider/featured", { method: "DELETE" });
    setFeaturedEventId("");
    setPinLoading(null);
  }

  function handleStartEditSlide(index: number) {
    const s = slides[index];
    setSlideEditing(index);
    setSlideTitle(s.title);
    setSlideSub(s.sub);
    setSlideFlickrUrl(s.flickrUrl ?? "");
    setSlideError("");
    setSlideSuccess("");
  }

  async function handleSaveSlide(e: React.FormEvent) {
    e.preventDefault();
    if (slideEditing === null) return;
    setSlideLoading(true);
    setSlideError("");
    setSlideSuccess("");
    const res = await fetch("/api/admin/slider", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        index: slideEditing,
        title: slideTitle,
        sub: slideSub,
        flickrUrl: slideFlickrUrl,
        existingImageUrl: slides[slideEditing]?.imageUrl ?? "",
        gradient: slides[slideEditing]?.gradient,
      }),
    });
    setSlideLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setSlideError(data.error ?? "Failed to save");
      return;
    }
    const data = await res.json();
    setSlides((prev) =>
      prev.map((s, i) =>
        i === slideEditing
          ? { ...s, title: slideTitle, sub: slideSub, flickrUrl: slideFlickrUrl, imageUrl: data.imageUrl ?? s.imageUrl }
          : s
      )
    );
    setSlideSuccess("Slide saved!");
    setSlideEditing(null);
  }

  async function handleSaveEventDuration(e: React.FormEvent) {
    e.preventDefault();
    setEventDurLoading(true);
    setEventDurError("");
    setEventDurSuccess("");
    const res = await fetch("/api/admin/slider", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventDuration }),
    });
    setEventDurLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setEventDurError(data.error ?? "Failed to save");
      return;
    }
    setEventDurSuccess("Duration saved!");
    setTimeout(() => setEventDurSuccess(""), 3000);
  }

  async function handleAddEvent(e: React.FormEvent) {
    e.preventDefault();
    setEvLoading(true);
    setEvError("");
    setEvSuccess("");

    const eventBody = {
      title: evTitle, date: evDate,
      startTime: evStartTime, endTime: evEndTime,
      location: evLocation, description: evDesc, flickrUrl: evFlickrUrl,
      totalSlots: evTotalSlots, blockBookings: evBlockBookings,
    };

    if (editingEventId) {
      const existing = events.find((ev) => ev.id === editingEventId);
      const res = await fetch(`/api/admin/events/${editingEventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...eventBody, existingImageUrl: existing?.imageUrl ?? "" }),
      });
      setEvLoading(false);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setEvError(data.error ?? "Failed to save");
        return;
      }
      const time = evStartTime && evEndTime ? `${evStartTime} - ${evEndTime}` : "";
      setEvents((prev) => prev.map((ev) => ev.id === editingEventId
        ? { ...ev, ...eventBody, time, startTime: evStartTime, endTime: evEndTime, totalSlots: String(evTotalSlots), blockBookings: evBlockBookings ? "1" : "0" }
        : ev
      ));
      setEvSuccess("Event updated!");
      handleCancelEdit();
      router.refresh();
      return;
    }

    const res = await fetch("/api/admin/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventBody),
    });
    setEvLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setEvError(data.error ?? "Failed to add");
      return;
    }
    handleCancelEdit();
    setEvSuccess("Event added!");
    router.refresh();
  }

  async function handleCancelEvent(id: string) {
    setCancelLoading(true);
    const res = await fetch(`/api/admin/events/${id}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: cancelReason }),
    });
    setCancelLoading(false);
    if (!res.ok) return;
    setEvents((prev) => prev.map((ev) => ev.id === id ? { ...ev, cancelled: "1", cancelReason } : ev));
    setCancellingEventId(null);
    setCancelReason("");
  }

  async function handleDeleteEvent(id: string) {
    if (!confirm("Delete this event?")) return;
    await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
    setEvents((prev) => prev.filter((ev) => ev.id !== id));
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setMemLoading(true); setMemError(""); setMemSuccess("");
    const res = await fetch("/api/admin/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: memName, email: memEmail, phone: memPhone }),
    });
    const data = await res.json().catch(() => ({}));
    setMemLoading(false);
    if (!res.ok) { setMemError(data.error ?? "Failed to add"); return; }
    setMembers((prev) => [data.member, ...prev]);
    setMemName(""); setMemEmail(""); setMemPhone("");
    setMemSuccess("Member added!");
    setTimeout(() => setMemSuccess(""), 3000);
  }

  async function handleDeleteMember(email: string) {
    if (!confirm(`Remove ${email} from members?`)) return;
    await fetch(`/api/admin/members/${encodeURIComponent(email)}`, { method: "DELETE" });
    setMembers((prev) => prev.filter((m) => m.email !== email));
  }

  function startEditMember(m: Member) {
    setEditingEmail(m.email);
    setEditName(m.name);
    setEditPhone(m.phone ?? "");
  }

  async function saveEditMember(email: string) {
    setEditSaving(true);
    await fetch(`/api/admin/members/${encodeURIComponent(email)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, phone: editPhone }),
    });
    setMembers((prev) => prev.map((m) => m.email === email ? { ...m, name: editName, phone: editPhone } : m));
    setEditingEmail(null);
    setEditSaving(false);
  }

  function handleOutreachForEvent(id: string) {
    setOutreachEventId(id);
    setTab("outreach");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSendOutreach(e: React.FormEvent) {
    e.preventDefault();
    if (!outreachEventId) { setOutreachError("Please select an event"); return; }
    if (outreachRecipients.size === 0) { setOutreachError("Please select at least one member"); return; }
    setOutreachLoading(true); setOutreachError(""); setOutreachSuccess("");
    const res = await fetch("/api/admin/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: outreachEventId, recipients: [...outreachRecipients], message: outreachMessage }),
    });
    const data = await res.json().catch(() => ({}));
    setOutreachLoading(false);
    if (!res.ok) { setOutreachError(data.error ?? "Failed to send"); return; }
    setOutreachSuccess(`Sent to ${data.sentCount} member${data.sentCount !== 1 ? "s" : ""}!`);
    const ev = events.find((ev) => ev.id === outreachEventId);
    if (ev && data.campaignId) {
      setCampaigns((prev) => [{
        id: data.campaignId, eventId: outreachEventId, eventTitle: ev.title,
        eventDate: ev.date, message: outreachMessage, sentAt: new Date().toISOString(),
        sentCount: String(data.sentCount), recipients: JSON.stringify([...outreachRecipients]),
      }, ...prev]);
    }
    setOutreachRecipients(new Set());
    setOutreachMessage("");
    setTimeout(() => setOutreachSuccess(""), 4000);
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
          <button className={tabClass("members")} onClick={() => setTab("members")}>👥 Members</button>
          <button className={tabClass("outreach")} onClick={() => setTab("outreach")}>📧 Outreach</button>
          <button className={tabClass("activities")} onClick={() => setTab("activities")}>📸 Club Photos</button>
          <button className={tabClass("slider")} onClick={() => setTab("slider")}>🖼️ Slider</button>
        </div>

        {tab === "bookings" && (
          <BookingsView bookings={bookings} loading={bookingsLoading} registrations={registrations}
            onConfirmReg={async (regId, eventId) => {
              await fetch(`/api/admin/events/${eventId}/registrations/${regId}`, { method: "PUT" });
              setRegistrations((prev) => prev ? prev.map((r) => r.id === regId ? { ...r, status: "confirmed" } : r) : prev);
            }}
            onCancelReg={async (regId, eventId) => {
              await fetch(`/api/admin/events/${eventId}/registrations/${regId}`, { method: "DELETE" });
              setRegistrations((prev) => prev ? prev.map((r) => r.id === regId ? { ...r, status: "cancelled" } : r) : prev);
            }}
          />
        )}

        {tab === "events" && (
          <>
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-5">
                {editingEventId ? "Edit Event" : "Add New Event"}
              </h2>
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
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start time</label>
                      <input type="time" value={evStartTime} onChange={e => setEvStartTime(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End time</label>
                      <input type="time" value={evEndTime} onChange={e => setEvEndTime(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total slots (0 = unlimited)</label>
                    <input type="number" min={0} value={evTotalSlots} onChange={e => setEvTotalSlots(Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div className="flex items-center gap-3 pt-5">
                    <input type="checkbox" id="blockBookings" checked={evBlockBookings} onChange={e => setEvBlockBookings(e.target.checked)}
                      className="w-4 h-4 accent-green-600" />
                    <label htmlFor="blockBookings" className="text-sm font-medium text-gray-700">
                      Block booking slots during event
                    </label>
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
                <div className="flex items-center gap-3">
                  <button type="submit" disabled={evLoading}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50">
                    {evLoading ? "Saving…" : editingEventId ? "Save Changes" : "Add Event"}
                  </button>
                  {editingEventId && (
                    <button type="button" onClick={handleCancelEdit}
                      className="text-sm text-gray-500 hover:text-gray-700 font-medium">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            <h2 className="text-lg font-bold text-gray-900 mb-4">All Events <span className="text-gray-400 font-normal text-base">({events.length})</span></h2>
            {events.length === 0 ? (
              <div className="text-center py-14 bg-white rounded-2xl border border-gray-200 text-gray-400">No events yet.</div>
            ) : (
              <div className="space-y-3">
                {[...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(ev => {
                  const isCancelled = ev.cancelled === "1";
                  const isFuture = new Date(ev.date) >= new Date(new Date().toDateString());
                  return (
                    <div key={ev.id} className={`bg-white rounded-xl border px-5 py-4 shadow-sm ${isCancelled ? "border-red-100 opacity-60" : "border-gray-200"}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900 text-sm">{ev.title}</p>
                            {isCancelled && <span className="text-xs bg-red-100 text-red-600 rounded-full px-2 py-0.5 font-semibold">Cancelled</span>}
                            {ev.totalSlots && Number(ev.totalSlots) > 0 && (() => {
                              const total = Number(ev.totalSlots);
                              const used = Number(ev.usedSlots ?? 0);
                              const remaining = total - used;
                              return (
                                <span className={`text-xs rounded-full px-2 py-0.5 ${
                                  remaining === 0 ? "bg-red-100 text-red-500" :
                                  remaining <= 2 ? "bg-orange-100 text-orange-500" :
                                  "bg-gray-100 text-gray-500"
                                }`}>
                                  {remaining}/{total} remaining
                                </span>
                              );
                            })()}
                            {ev.blockBookings === "1" && <span className="text-xs bg-orange-50 text-orange-500 rounded-full px-2 py-0.5">🚫 Blocks slots</span>}
                          </div>
                          <p className="text-green-600 text-xs mt-0.5">
                            {new Date(ev.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            {ev.time && ` · ${ev.time}`}
                          </p>
                          {ev.location && <p className="text-gray-400 text-xs mt-0.5">📍 {ev.location}</p>}
                          {ev.description && <p className="text-gray-500 text-xs mt-1 line-clamp-1">{ev.description}</p>}
                          {isCancelled && ev.cancelReason && <p className="text-red-400 text-xs mt-1">Reason: {ev.cancelReason}</p>}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 flex-wrap justify-end">
                          {!isCancelled && (
                            <>
                              <button onClick={() => handleDeleteEvent(ev.id)} className="text-xs text-red-400 hover:text-red-600 font-medium">Delete</button>
                              <button onClick={() => handleStartEdit(ev)} className="text-xs text-blue-500 hover:text-blue-700 font-medium">Edit</button>
                              <button onClick={() => toggleEventRegistrants(ev.id)}
                                className="text-xs text-purple-500 hover:text-purple-700 font-medium">
                                {expandedEventId === ev.id ? "Hide Registrants" : "Registrants"}
                              </button>
                              <button onClick={() => handleOutreachForEvent(ev.id)}
                                className="text-xs text-teal-500 hover:text-teal-700 font-medium">
                                📧 Invite
                              </button>
                              {featuredEventId === ev.id ? (
                                <button onClick={handleUnpinEvent} disabled={pinLoading === "unpin"}
                                  className="text-xs text-amber-500 hover:text-amber-700 font-medium disabled:opacity-50">
                                  {pinLoading === "unpin" ? "…" : "📌 Unpin"}
                                </button>
                              ) : (
                                <button onClick={() => handlePinEvent(ev.id)} disabled={pinLoading === ev.id}
                                  className="text-xs text-gray-400 hover:text-green-600 font-medium disabled:opacity-50">
                                  {pinLoading === ev.id ? "…" : "📌 Pin"}
                                </button>
                              )}
                              {isFuture && (
                                <button onClick={() => { setCancellingEventId(ev.id); setCancelReason(""); }}
                                  className="text-xs text-orange-400 hover:text-orange-600 font-medium">
                                  Cancel Event
                                </button>
                              )}
                            </>
                          )}
                          {isCancelled && (
                            <button onClick={() => handleDeleteEvent(ev.id)} className="text-xs text-red-400 hover:text-red-600 font-medium">Delete</button>
                          )}
                        </div>
                      </div>
                      {/* Registrants panel */}
                      {expandedEventId === ev.id && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          {eventRegsLoading === ev.id ? (
                            <p className="text-xs text-gray-400 py-2">Loading registrants…</p>
                          ) : (eventRegs[ev.id] ?? []).length === 0 ? (
                            <p className="text-xs text-gray-400 py-2">No registrations yet.</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-gray-400 border-b border-gray-100">
                                    <th className="text-left py-1.5 pr-3 font-medium">Name</th>
                                    <th className="text-left py-1.5 pr-3 font-medium">Email</th>
                                    <th className="text-left py-1.5 pr-3 font-medium">Phone</th>
                                    <th className="text-center py-1.5 pr-3 font-medium">Seats</th>
                                    <th className="text-center py-1.5 pr-3 font-medium">Status</th>
                                    <th className="py-1.5 font-medium"></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(eventRegs[ev.id] ?? []).map((r) => (
                                    <tr key={r.id} className={`border-b border-gray-50 last:border-0 ${r.status === "cancelled" ? "opacity-40" : ""}`}>
                                      <td className="py-1.5 pr-3 font-medium text-gray-900">{r.name}</td>
                                      <td className="py-1.5 pr-3 text-gray-500">{r.email}</td>
                                      <td className="py-1.5 pr-3 text-gray-400">{r.phone || "—"}</td>
                                      <td className="py-1.5 pr-3 text-center text-gray-700">{r.seats}</td>
                                      <td className="py-1.5 pr-3 text-center">
                                        <span className={`px-2 py-0.5 rounded-full font-semibold ${
                                          r.status === "confirmed" ? "bg-green-100 text-green-700" :
                                          r.status === "cancelled" ? "bg-gray-100 text-gray-400" :
                                          "bg-amber-100 text-amber-700"
                                        }`}>{r.status}</span>
                                      </td>
                                      <td className="py-1.5 text-right">
                                        {r.status === "pending" && (
                                          <div className="flex gap-2 justify-end">
                                            <button onClick={() => handleConfirmEventReg(r.id, ev.id)}
                                              className="text-green-600 hover:text-green-800 font-semibold">Confirm</button>
                                            <button onClick={() => handleCancelEventReg(r.id, ev.id)}
                                              className="text-red-400 hover:text-red-600 font-semibold">Cancel</button>
                                          </div>
                                        )}
                                        {r.status === "confirmed" && (
                                          <button onClick={() => handleCancelEventReg(r.id, ev.id)}
                                            className="text-red-400 hover:text-red-600 font-semibold">Cancel</button>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                      {cancellingEventId === ev.id && (
                        <div className="mt-3 pt-3 border-t border-orange-100 bg-orange-50 rounded-xl p-3">
                          <p className="text-xs font-semibold text-orange-700 mb-2">Cancel this event? All confirmed registrants will be emailed.</p>
                          <input type="text" value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                            className="w-full border border-orange-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 mb-2 bg-white"
                            placeholder="Reason (optional)…" />
                          <div className="flex gap-2">
                            <button onClick={() => handleCancelEvent(ev.id)} disabled={cancelLoading}
                              className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50">
                              {cancelLoading ? "Cancelling…" : "Confirm Cancel"}
                            </button>
                            <button onClick={() => setCancellingEventId(null)} className="text-xs text-gray-500 hover:text-gray-700 font-medium">
                              Back
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === "members" && (
          <>
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Add Member</h2>
              <p className="text-sm text-gray-500 mb-5">Members are also added automatically whenever someone makes a booking or registers for an event.</p>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full name <span className="text-red-400">*</span></label>
                    <input type="text" value={memName} onChange={e => setMemName(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Jane Smith" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-400">*</span></label>
                    <input type="email" value={memEmail} onChange={e => setMemEmail(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="jane@example.com" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input type="tel" value={memPhone} onChange={e => setMemPhone(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="+84 xxx xxx xxxx" />
                  </div>
                </div>
                {memError && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{memError}</p>}
                {memSuccess && <p className="text-green-600 text-sm bg-green-50 px-3 py-2 rounded-lg">{memSuccess}</p>}
                <button type="submit" disabled={memLoading}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50">
                  {memLoading ? "Adding…" : "Add Member"}
                </button>
              </form>
            </div>

            <h2 className="text-lg font-bold text-gray-900 mb-4">All Members <span className="text-gray-400 font-normal text-base">({members.length})</span></h2>
            {members.length === 0 ? (
              <div className="text-center py-14 bg-white rounded-2xl border border-gray-200 text-gray-400">No members yet. They are added automatically when someone books or registers for an event.</div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50 text-gray-400 text-xs font-medium">
                        <th className="text-left px-4 py-3">Name</th>
                        <th className="text-left px-4 py-3">Email</th>
                        <th className="text-left px-4 py-3">Phone</th>
                        <th className="text-left px-4 py-3">Source</th>
                        <th className="text-left px-4 py-3">Joined</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m) => (
                        <tr key={m.email} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                          {editingEmail === m.email ? (
                            <>
                              <td className="px-4 py-2">
                                <input value={editName} onChange={e => setEditName(e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                              </td>
                              <td className="px-4 py-2 text-gray-500 text-sm">{m.email}</td>
                              <td className="px-4 py-2">
                                <input value={editPhone} onChange={e => setEditPhone(e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                              </td>
                              <td className="px-4 py-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  m.source === "booking" ? "bg-blue-50 text-blue-600" :
                                  m.source === "event" ? "bg-teal-50 text-teal-600" :
                                  "bg-gray-100 text-gray-500"
                                }`}>{m.source}</span>
                              </td>
                              <td className="px-4 py-2 text-gray-400 text-xs">{new Date(m.createdAt).toLocaleDateString("en-GB")}</td>
                              <td className="px-4 py-2 text-right">
                                <div className="flex gap-2 justify-end">
                                  <button onClick={() => saveEditMember(m.email)} disabled={editSaving}
                                    className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg font-medium disabled:opacity-50">
                                    {editSaving ? "Saving…" : "Save"}
                                  </button>
                                  <button onClick={() => setEditingEmail(null)}
                                    className="text-xs text-gray-400 hover:text-gray-600 font-medium">Cancel</button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-3 font-medium text-gray-900">{m.name}</td>
                              <td className="px-4 py-3 text-gray-500">{m.email}</td>
                              <td className="px-4 py-3 text-gray-400">{m.phone || "—"}</td>
                              <td className="px-4 py-3">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  m.source === "booking" ? "bg-blue-50 text-blue-600" :
                                  m.source === "event" ? "bg-teal-50 text-teal-600" :
                                  "bg-gray-100 text-gray-500"
                                }`}>{m.source}</span>
                              </td>
                              <td className="px-4 py-3 text-gray-400 text-xs">{new Date(m.createdAt).toLocaleDateString("en-GB")}</td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex gap-3 justify-end">
                                  <button onClick={() => startEditMember(m)} className="text-xs text-blue-500 hover:text-blue-700 font-medium">Edit</button>
                                  <button onClick={() => handleDeleteMember(m.email)} className="text-xs text-red-400 hover:text-red-600 font-medium">Remove</button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {tab === "outreach" && (
          <>
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Send Event Invitation</h2>
              <p className="text-sm text-gray-500 mb-5">Pick an event and members to invite. Each recipient gets a personalised email with a link to register on the website.</p>
              <form onSubmit={handleSendOutreach} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event <span className="text-red-400">*</span></label>
                  <select value={outreachEventId} onChange={e => setOutreachEventId(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">— Select an event —</option>
                    {events.filter(ev => ev.cancelled !== "1").map((ev) => (
                      <option key={ev.id} value={ev.id}>{ev.title} · {new Date(ev.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Recipients <span className="text-red-400">*</span></label>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setOutreachRecipients(new Set(members.map(m => m.email)))}
                        className="text-xs text-green-600 hover:text-green-800 font-medium">Select all</button>
                      <button type="button" onClick={() => setOutreachRecipients(new Set())}
                        className="text-xs text-gray-400 hover:text-gray-600 font-medium">Clear</button>
                    </div>
                  </div>
                  {members.length === 0 ? (
                    <p className="text-sm text-gray-400 bg-gray-50 rounded-xl px-4 py-6 text-center">No members yet. Add members in the Members tab.</p>
                  ) : (
                    <div className="border border-gray-200 rounded-xl divide-y divide-gray-50 max-h-64 overflow-y-auto">
                      {members.map((m) => (
                        <label key={m.email} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer">
                          <input type="checkbox" checked={outreachRecipients.has(m.email)}
                            onChange={(e) => {
                              setOutreachRecipients((prev) => {
                                const next = new Set(prev);
                                if (e.target.checked) { next.add(m.email); } else { next.delete(m.email); }
                                return next;
                              });
                            }}
                            className="w-4 h-4 accent-green-600" />
                          <span className="flex-1 text-sm text-gray-800">{m.name}</span>
                          <span className="text-xs text-gray-400">{m.email}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {outreachRecipients.size > 0 && (
                    <p className="text-xs text-green-600 mt-1.5">{outreachRecipients.size} recipient{outreachRecipients.size !== 1 ? "s" : ""} selected</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Personal note <span className="text-gray-400 font-normal">(optional)</span></label>
                  <textarea value={outreachMessage} onChange={e => setOutreachMessage(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    rows={3} placeholder="Add a personal note included in the invitation email…" />
                </div>

                {outreachError && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{outreachError}</p>}
                {outreachSuccess && <p className="text-green-600 text-sm bg-green-50 px-3 py-2 rounded-lg">{outreachSuccess}</p>}
                <button type="submit" disabled={outreachLoading}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50">
                  {outreachLoading ? "Sending…" : `Send Invitation${outreachRecipients.size > 0 ? ` to ${outreachRecipients.size}` : ""}`}
                </button>
              </form>
            </div>

            <h2 className="text-lg font-bold text-gray-900 mb-4">Campaign History <span className="text-gray-400 font-normal text-base">({campaigns.length})</span></h2>
            {campaigns.length === 0 ? (
              <div className="text-center py-14 bg-white rounded-2xl border border-gray-200 text-gray-400">No campaigns sent yet.</div>
            ) : (
              <div className="space-y-3">
                {campaigns.map((c) => {
                  const recipientList: string[] = JSON.parse(c.recipients ?? "[]");
                  return (
                    <div key={c.id} className="bg-white rounded-xl border border-gray-200 px-5 py-4 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{c.eventTitle}</p>
                          <p className="text-green-600 text-xs mt-0.5">{new Date(c.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                          {c.message && <p className="text-gray-500 text-xs mt-1 line-clamp-1">{c.message}</p>}
                          <p className="text-gray-400 text-xs mt-1.5">
                            Sent to {recipientList.length} member{recipientList.length !== 1 ? "s" : ""} · {new Date(c.sentAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">{c.sentCount} sent</span>
                      </div>
                    </div>
                  );
                })}
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

        {tab === "slider" && (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900">Home Page Slider</h2>
              <p className="text-sm text-gray-500 mt-1">
                Edit the 3 base slides shown on the home page. Pin an event (from the Events tab) to add it as the first slide.
              </p>
            </div>

            <div className="space-y-4">
              {slides.map((slide, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="flex items-start gap-4 p-5">
                    {/* Thumbnail */}
                    <div className={`flex-shrink-0 w-24 h-16 rounded-xl overflow-hidden bg-gradient-to-br ${slide.gradient} flex items-center justify-center`}>
                      {slide.imageUrl ? (
                        <img src={slide.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white text-2xl">🏸</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">Slide {i + 1}</p>
                      <p className="text-gray-700 text-sm">{slide.title}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{slide.sub}</p>
                    </div>
                    <button
                      onClick={() => handleStartEditSlide(i)}
                      className="text-xs text-blue-500 hover:text-blue-700 font-medium flex-shrink-0"
                    >
                      Edit
                    </button>
                  </div>

                  {slideEditing === i && (
                    <form onSubmit={handleSaveSlide} className="border-t border-gray-100 p-5 space-y-4 bg-gray-50">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input type="text" value={slideTitle} onChange={e => setSlideTitle(e.target.value)}
                          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Slide title" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                        <input type="text" value={slideSub} onChange={e => setSlideSub(e.target.value)}
                          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Short subtitle text" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Photo (Flickr URL)</label>
                        <input type="url" value={slideFlickrUrl} onChange={e => setSlideFlickrUrl(e.target.value)}
                          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="https://www.flickr.com/photos/user/12345678/" />
                        <p className="text-xs text-gray-400 mt-1">Leave blank to keep existing image. Fetches 1024px version for best quality.</p>
                      </div>
                      {slideError && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{slideError}</p>}
                      {slideSuccess && <p className="text-green-600 text-sm bg-green-50 px-3 py-2 rounded-lg">{slideSuccess}</p>}
                      <div className="flex items-center gap-3">
                        <button type="submit" disabled={slideLoading}
                          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors disabled:opacity-50">
                          {slideLoading ? "Saving…" : "Save Slide"}
                        </button>
                        <button type="button" onClick={() => setSlideEditing(null)}
                          className="text-sm text-gray-500 hover:text-gray-700 font-medium">
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ))}
            </div>

            {featuredEventId && (() => {
              const ev = events.find(e => e.id === featuredEventId);
              return ev ? (
                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-1">📌 Pinned to Slider (Slide 1)</p>
                      <p className="font-semibold text-gray-900 text-sm">{ev.title}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{ev.date}{ev.time ? ` · ${ev.time}` : ""}</p>
                    </div>
                    <button onClick={handleUnpinEvent} disabled={pinLoading === "unpin"}
                      className="text-xs text-red-400 hover:text-red-600 font-medium disabled:opacity-50">
                      {pinLoading === "unpin" ? "…" : "Unpin"}
                    </button>
                  </div>
                </div>
              ) : null;
            })()}

            {/* Event slide duration setting */}
            <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-gray-900 mb-1">⏱️ Event Slide Duration</p>
              <p className="text-xs text-gray-500 mb-4">
                How long the pinned event slide stays visible before advancing (in seconds).
              </p>
              <form onSubmit={handleSaveEventDuration} className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={60}
                  step={1}
                  value={Math.round(eventDuration / 1000)}
                  onChange={(e) => setEventDuration(Math.max(1, Number(e.target.value)) * 1000)}
                  className="w-24 border border-gray-300 rounded-xl px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <span className="text-sm text-gray-500">seconds</span>
                <button
                  type="submit"
                  disabled={eventDurLoading}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50"
                >
                  {eventDurLoading ? "Saving…" : "Save"}
                </button>
                {eventDurError && <span className="text-red-500 text-xs">{eventDurError}</span>}
                {eventDurSuccess && <span className="text-green-600 text-xs">{eventDurSuccess}</span>}
              </form>
            </div>
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
  registrations,
  onConfirmReg,
  onCancelReg,
}: {
  bookings: Booking[] | null;
  loading: boolean;
  registrations: EventRegistration[] | null;
  onConfirmReg: (regId: string, eventId: string) => Promise<void>;
  onCancelReg: (regId: string, eventId: string) => Promise<void>;
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

      {/* Event Registrations */}
      {registrations && registrations.length > 0 && (
        <div className="mt-8">
          <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            🎾 Event Registrations
            <span className="text-sm font-normal text-gray-400">({registrations.filter(r => r.status !== "cancelled").length} active)</span>
          </h3>
          <div className="space-y-2">
            {registrations.filter(r => r.status !== "cancelled").map((r) => (
              <div key={r.id} className={`bg-white rounded-xl border px-5 py-4 ${r.status === "pending" ? "border-amber-300" : "border-gray-200"}`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold bg-purple-100 text-purple-700 rounded-full px-2 py-0.5">EVENT</span>
                      <p className="font-semibold text-gray-900 text-sm">{r.name}</p>
                      {r.status === "pending" && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">⏳ Pending</span>}
                      {r.status === "confirmed" && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">✓ Confirmed</span>}
                    </div>
                    <p className="text-gray-400 text-xs truncate">{r.email}{r.phone ? ` · ${r.phone}` : ""}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      <span className="font-medium">{r.eventTitle}</span>
                      {r.eventDate && ` · ${new Date(r.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
                      {r.eventTime && ` · ${r.eventTime}`}
                      {` · 🎟️ ${r.seats} seat${Number(r.seats) > 1 ? "s" : ""}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {r.status === "pending" && (
                      <button onClick={() => onConfirmReg(r.id, r.eventId)}
                        className="text-xs font-semibold bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                        ✓ Confirm
                      </button>
                    )}
                    <button onClick={() => onCancelReg(r.id, r.eventId)}
                      className="text-xs font-semibold text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
