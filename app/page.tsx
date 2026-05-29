import { getSession } from "@/lib/session";
import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import { HeroSlider } from "@/components/HeroSlider";
import { redis } from "@/lib/redis";
import { DEFAULT_SLIDES, type Slide } from "@/lib/slides";

export default async function Home() {
  const session = await getSession();
  const isLoggedIn = session.isLoggedIn;

  // Fetch editable base slides from Redis (fall back to defaults)
  const baseSlides: Slide[] = await Promise.all(
    [0, 1, 2].map(async (i) => {
      const s = await redis.hgetall<Record<string, string>>(`slider:${i}`);
      return (s && s.title)
        ? { title: s.title, sub: s.sub ?? "", imageUrl: s.imageUrl ?? "", gradient: s.gradient || DEFAULT_SLIDES[i].gradient }
        : DEFAULT_SLIDES[i];
    })
  );

  // Fetch featured event (pinned to slider)
  const [featuredId, rawEventDuration] = await Promise.all([
    redis.get("slider:featured") as Promise<string | null>,
    redis.get("slider:eventDuration"),
  ]);
  const eventDuration = Number(rawEventDuration) || 8000;
  const featuredSlides: Slide[] = [];
  if (featuredId) {
    const ev = await redis.hgetall<Record<string, string>>(`event:${featuredId}`);
    if (ev && ev.title) {
      // Auto-remove if event date has passed (remove 1 day after the event)
      const todayStr = new Date().toISOString().split("T")[0];
      if (ev.date && todayStr > ev.date) {
        redis.del("slider:featured").catch(() => {});
      } else {
        featuredSlides.push({
          title: ev.title,
          sub: [ev.time, ev.location].filter(Boolean).join(" · "),
          imageUrl: ev.imageUrl ? ev.imageUrl.replace(/_z\.(jpg|jpeg|png)$/i, "_b.$1") : "",
          gradient: "from-green-900 via-green-800 to-teal-900",
          isEvent: true,
          eventId: featuredId,
          duration: eventDuration,
        });
      }
    }
  }

  const slides: Slide[] = [...featuredSlides, ...baseSlides];

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar email={isLoggedIn ? session.email : null} />

      {/* Hero Slider */}
      <HeroSlider slides={slides} />

      {/* Book CTA */}
      <section className="bg-white py-12 px-4 text-center border-b border-gray-100">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          Ready to improve your game?
        </h2>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Book a 1-hour coaching session — choose any open slot that fits your schedule.
        </p>
        <Link
          href={isLoggedIn ? "/calendar" : "/login"}
          className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold text-lg px-10 py-4 rounded-2xl shadow-md hover:shadow-lg transition-all"
        >
          Book a Session →
        </Link>
        {!isLoggedIn && (
          <p className="text-gray-400 text-sm mt-3">
            You&apos;ll be asked to sign in first — no password needed.
          </p>
        )}
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
          Why The Birdie Club?
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: "🏸",
              title: "Expert Coaching",
              desc: "Personalised 1-on-1 sessions with experienced coaches who adapt to your level.",
            },
            {
              icon: "📅",
              title: "Flexible Schedule",
              desc: "Open every day from 8 AM to 7 PM. Book the slot that works for you.",
            },
            {
              icon: "⚡",
              title: "Instant Booking",
              desc: "Log in with your email — no password needed. Pick a slot and you&apos;re confirmed.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl border border-gray-200 p-6 text-center shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Schedule */}
      <section className="bg-green-600 text-white py-14 px-4 text-center">
        <h2 className="text-2xl font-bold mb-3">Our Schedule</h2>
        <p className="text-green-100 mb-6 max-w-sm mx-auto">
          Sessions run every day of the week. Each slot is 1 hour.
        </p>
        <div className="flex flex-wrap justify-center gap-3 max-w-lg mx-auto">
          {["8:00", "9:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"].map((t) => (
            <span
              key={t}
              className="bg-white/20 border border-white/30 rounded-xl px-4 py-2 text-sm font-medium"
            >
              {t}
            </span>
          ))}
          <span className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm font-medium text-white/60 line-through">
            12:00 – 14:00
          </span>
        </div>
        <p className="text-green-200 text-xs mt-4">Lunch break 12:00 – 14:00 · All times local</p>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-400 text-sm border-t border-gray-200 bg-white">
        © {new Date().getFullYear()} The Birdie Club · Built with ❤️
      </footer>
    </div>
  );
}
