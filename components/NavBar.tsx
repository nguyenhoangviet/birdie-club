"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export function NavBar({ email }: { email: string }) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const linkClass = (path: string) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      pathname === path
        ? "bg-green-100 text-green-700"
        : "text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/calendar" className="flex items-center gap-2 font-bold text-gray-900 text-lg">
          <span className="text-2xl">🏸</span>
          <span>The Birdie Club</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link href="/calendar" className={linkClass("/calendar")}>
            Book a Session
          </Link>
          <Link href="/my-bookings" className={linkClass("/my-bookings")}>
            My Bookings
          </Link>
          <div className="ml-3 pl-3 border-l border-gray-200 flex items-center gap-3">
            <span className="text-sm text-gray-400 hidden sm:block truncate max-w-[180px]">
              {email}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-red-500 transition-colors font-medium"
            >
              Sign out
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
