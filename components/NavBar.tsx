"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

export function NavBar({ email }: { email?: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    setOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  const linkCls = (path: string) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      pathname === path ? "bg-green-100 text-green-700" : "text-gray-600 hover:bg-gray-100"
    }`;

  const mobileLinkCls = (path: string) =>
    `block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
      pathname === path ? "bg-green-100 text-green-700" : "text-gray-700 hover:bg-gray-100"
    }`;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-gray-900 text-lg shrink-0" onClick={() => setOpen(false)}>
          <span className="text-2xl">🏸</span>
          <span className="hidden sm:inline">The Birdie Club</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/events" className={linkCls("/events")}>Events</Link>
          <Link href="/activities" className={linkCls("/activities")}>Activities</Link>
          {email ? (
            <>
              <Link href="/calendar" className={linkCls("/calendar")}>Book</Link>
              <Link href="/my-bookings" className={linkCls("/my-bookings")}>My Bookings</Link>
              <Link href="/profile" className={linkCls("/profile")}>Profile</Link>
              <div className="ml-3 pl-3 border-l border-gray-200 flex items-center gap-3">
                <span className="text-xs text-gray-400 hidden lg:block truncate max-w-[140px]">{email}</span>
                <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-500 font-medium transition-colors">
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <Link href="/login" className="ml-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors">
              Sign In
            </Link>
          )}
        </nav>

        {/* Mobile: right side */}
        <div className="flex md:hidden items-center gap-2">
          {!email && (
            <Link href="/login" onClick={() => setOpen(false)} className="px-3 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors">
              Sign In
            </Link>
          )}
          <button
            onClick={() => setOpen(!open)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {open ? (
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1 shadow-lg">
          <Link href="/events" className={mobileLinkCls("/events")} onClick={() => setOpen(false)}>📅 Events</Link>
          <Link href="/activities" className={mobileLinkCls("/activities")} onClick={() => setOpen(false)}>📸 Activities</Link>
          {email ? (
            <>
              <Link href="/calendar" className={mobileLinkCls("/calendar")} onClick={() => setOpen(false)}>🏸 Book a Session</Link>
              <Link href="/my-bookings" className={mobileLinkCls("/my-bookings")} onClick={() => setOpen(false)}>📋 My Bookings</Link>
              <Link href="/profile" className={mobileLinkCls("/profile")} onClick={() => setOpen(false)}>👤 Profile</Link>
              <div className="border-t border-gray-100 pt-2 mt-2">
                <p className="text-xs text-gray-400 px-4 pb-2">{email}</p>
                <button onClick={handleLogout} className="block w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                  Sign out
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}
    </header>
  );
}
