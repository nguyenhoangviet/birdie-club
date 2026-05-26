import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/admin";
import { NavBar } from "@/components/NavBar";
import { AdminDashboard } from "@/components/AdminDashboard";

export default async function AdminPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");
  if (!isAdminEmail(session.email)) redirect("/calendar");

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar email={session.email} isAdmin />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Review booking requests and manage upcoming sessions.
          </p>
        </div>
        <AdminDashboard />
      </main>
    </div>
  );
}
