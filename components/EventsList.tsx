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
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function EventCard({ event, isPast }: { event: ClubEvent; isPast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const hasLongDesc = (event.description?.length ?? 0) > 140;

  return (
    <div
      className={`bg-white rounded-2xl border overflow-hidden shadow-sm transition-all hover:shadow-md ${
        isPast ? "border-gray-100 opacity-55 grayscale" : "border-gray-200"
      }`}
    >
      {event.imageUrl && (
        <img
          src={event.imageUrl}
          alt={event.title}
          className="w-full h-52 object-cover"
        />
      )}

      <div className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          {/* Left: title + description */}
          <div className="flex-1 min-w-0">
            {isPast && (
              <span className="inline-block text-xs bg-gray-100 text-gray-500 rounded-full px-2.5 py-0.5 mb-2 font-medium">
                Past
              </span>
            )}
            <h2 className="text-lg font-bold text-gray-900 leading-snug">
              {event.title}
            </h2>

            {event.description && (
              <div className="mt-2">
                <p
                  className={`text-gray-500 text-sm leading-relaxed ${
                    !expanded && hasLongDesc ? "line-clamp-2" : "whitespace-pre-line"
                  }`}
                >
                  {event.description}
                </p>
                {hasLongDesc && (
                  <button
                    onClick={() => setExpanded((v) => !v)}
                    className="text-green-600 text-sm font-medium mt-1 hover:underline focus:outline-none"
                  >
                    {expanded ? "Show less ↑" : "Read more ↓"}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right: date badge */}
          <div
            className={`flex-shrink-0 rounded-xl px-4 py-3 text-center min-w-[130px] ${
              isPast
                ? "bg-gray-50 border border-gray-100"
                : "bg-green-50 border border-green-100"
            }`}
          >
            <p
              className={`font-bold text-sm leading-snug ${
                isPast ? "text-gray-400" : "text-green-700"
              }`}
            >
              {formatDate(event.date)}
            </p>
            {event.time && (
              <p
                className={`text-sm mt-0.5 ${
                  isPast ? "text-gray-400" : "text-green-600"
                }`}
              >
                🕐 {event.time}
              </p>
            )}
          </div>
        </div>

        {event.location && (
          <p className="text-gray-400 text-sm mt-3 flex items-center gap-1">
            <span>📍</span>
            <span>{event.location}</span>
          </p>
        )}
      </div>
    </div>
  );
}

export function EventsList({
  upcoming,
  past,
}: {
  upcoming: ClubEvent[];
  past: ClubEvent[];
}) {
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
          {upcoming.map((e) => (
            <EventCard key={e.id} event={e} isPast={false} />
          ))}
        </div>
      )}

      {past.length > 0 && (
        <div className="mt-12">
          <h2 className="text-base font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Past Events
          </h2>
          <div className="space-y-3">
            {past.map((e) => (
              <EventCard key={e.id} event={e} isPast={true} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
