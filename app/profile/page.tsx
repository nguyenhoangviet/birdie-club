import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { redis } from "@/lib/redis";
import { NavBar } from "@/components/NavBar";
import { ProfileForm } from "@/components/ProfileForm";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");

  const profile =
    (await redis.hgetall<Record<string, string>>(`profile:${session.email}`)) ?? {};

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar email={session.email} />
      <main className="max-w-lg mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500 text-sm mt-1">{session.email}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <ProfileForm initial={profile} />
        </div>
      </main>
    </div>
  );
}
