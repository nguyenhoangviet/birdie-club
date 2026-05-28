"use client";

import { useState, useEffect } from "react";

interface Activity {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  createdAt: string;
}

function getLargeUrl(url?: string): string | undefined {
  if (!url) return url;
  // Upgrade Flickr _z (640px) → _b (1024px)
  return url.replace(/_z\.(jpg|jpeg|png)$/i, "_b.$1");
}

export function ActivitiesGallery({ activities }: { activities: Activity[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const close = () => setLightboxIndex(null);
  const prev = () =>
    setLightboxIndex((i) =>
      i === null ? null : (i - 1 + activities.length) % activities.length
    );
  const next = () =>
    setLightboxIndex((i) =>
      i === null ? null : (i + 1) % activities.length
    );

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxIndex, activities.length]);

  // Lock body scroll when lightbox open
  useEffect(() => {
    document.body.style.overflow = lightboxIndex !== null ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxIndex]);

  const current = lightboxIndex !== null ? activities[lightboxIndex] : null;

  return (
    <>
      <div className="columns-2 md:columns-3 gap-4">
        {activities.map((a, i) => (
          <div
            key={a.id}
            onClick={() => setLightboxIndex(i)}
            className="break-inside-avoid mb-4 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
          >
            {a.imageUrl ? (
              <div className="relative overflow-hidden">
                <img
                  src={a.imageUrl}
                  alt={a.title}
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0zm0 0l4 4"
                    />
                  </svg>
                </div>
              </div>
            ) : (
              <div className="aspect-[4/3] bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center">
                <span className="text-white text-5xl">🏸</span>
              </div>
            )}
            <div className="p-4">
              <h2 className="font-bold text-gray-900 text-sm leading-snug">{a.title}</h2>
              {a.description && (
                <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                  {a.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {current && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={close}
        >
          {/* Close button */}
          <button
            onClick={close}
            aria-label="Close"
            className="absolute top-4 right-5 text-white/70 hover:text-white text-4xl font-light leading-none z-10"
          >
            ×
          </button>

          {/* Counter */}
          {activities.length > 1 && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white/50 text-sm tabular-nums">
              {lightboxIndex! + 1} / {activities.length}
            </div>
          )}

          {/* Prev arrow */}
          {activities.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              aria-label="Previous"
              className="absolute left-3 sm:left-5 text-white/70 hover:text-white text-5xl z-10 p-2 select-none"
            >
              ‹
            </button>
          )}

          {/* Image + caption */}
          <div
            className="flex flex-col items-center gap-4 mx-16 sm:mx-24 max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {current.imageUrl ? (
              <img
                key={current.id}
                src={getLargeUrl(current.imageUrl)}
                alt={current.title}
                onError={(e) => {
                  // fall back to _z if _b doesn't exist
                  (e.target as HTMLImageElement).src = current.imageUrl!;
                }}
                className="max-h-[72vh] max-w-full object-contain rounded-xl shadow-2xl"
              />
            ) : (
              <div className="h-64 w-64 bg-gradient-to-br from-green-400 to-teal-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-6xl">🏸</span>
              </div>
            )}
            <div className="text-center px-4">
              <h3 className="text-white font-semibold text-base sm:text-lg leading-snug">
                {current.title}
              </h3>
              {current.description && (
                <p className="text-white/55 text-sm mt-1">{current.description}</p>
              )}
            </div>
          </div>

          {/* Next arrow */}
          {activities.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              aria-label="Next"
              className="absolute right-3 sm:right-5 text-white/70 hover:text-white text-5xl z-10 p-2 select-none"
            >
              ›
            </button>
          )}
        </div>
      )}
    </>
  );
}
