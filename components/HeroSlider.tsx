"use client";

import { useState, useEffect } from "react";
import type { Slide } from "@/lib/slides";

export function HeroSlider({ slides }: { slides: Slide[] }) {
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState<boolean[]>(slides.map(() => false));

  useEffect(() => {
    setLoaded(slides.map(() => false));
    setIdx(0);
  }, [slides.length]);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), 4500);
    return () => clearInterval(t);
  }, [slides.length]);

  return (
    <div className="relative overflow-hidden h-[520px] w-full">
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} transition-opacity duration-1000 ${
            i === idx ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {slide.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={slide.imageUrl}
              alt=""
              onLoad={() => setLoaded((prev) => { const n = [...prev]; n[i] = true; return n; })}
              onError={() => setLoaded((prev) => { const n = [...prev]; n[i] = false; return n; })}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                loaded[i] ? "opacity-100" : "opacity-0"
              }`}
            />
          )}
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/35" />

          {/* Event badge */}
          {slide.isEvent && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-green-500/90 text-white text-xs font-bold px-3 py-1 rounded-full tracking-wide uppercase z-10">
              Upcoming Event
            </div>
          )}

          {/* Text */}
          <div className="relative h-full flex flex-col items-center justify-center text-white text-center px-6">
            {!slide.isEvent && <div className="text-6xl mb-5 drop-shadow">🏸</div>}
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3 drop-shadow-lg leading-tight">
              {slide.title}
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-xl drop-shadow">
              {slide.sub}
            </p>
          </div>
        </div>
      ))}

      {/* Dot navigation */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            aria-label={`Slide ${i + 1}`}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              i === idx ? "bg-white w-7" : "bg-white/50 w-2.5"
            }`}
          />
        ))}
      </div>

      {/* Arrows */}
      <button
        onClick={() => setIdx((i) => (i - 1 + slides.length) % slides.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl transition z-10"
        aria-label="Previous slide"
      >
        ‹
      </button>
      <button
        onClick={() => setIdx((i) => (i + 1) % slides.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl transition z-10"
        aria-label="Next slide"
      >
        ›
      </button>
    </div>
  );
}
