import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { NavBar } from "@/components/NavBar";
import { WeekCalendar } from "@/components/WeekCalendar";

export default async function CalendarPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar email={session.email} />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Book a Session</h1>
          <p className="text-gray-500 text-sm mt-1">
            Select an available 1-hour slot to book your coaching session.
          </p>
        </div>
        <WeekCalendar />
      </main>
    </div>
  );
}
