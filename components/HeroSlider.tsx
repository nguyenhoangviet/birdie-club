"use client";

import { useState, useEffect } from "react";

const SLIDES = [
  {
    gradient: "from-green-900 via-green-700 to-emerald-600",
    image: "/slides/slide1.jpg",
    title: "Welcome to The Birdie Club",
    sub: "Professional badminton coaching for all levels",
  },
  {
    gradient: "from-teal-900 via-teal-700 to-cyan-600",
    image: "/slides/slide2.jpg",
    title: "Train With the Best",
    sub: "1-on-1 sessions tailored to your skill level",
  },
  {
    gradient: "from-emerald-900 via-green-800 to-lime-700",
    image: "/slides/slide3.jpg",
    title: "Join Our Community",
    sub: "Meet fellow players and improve together",
  },
];

// To add your own photos: place slide1.jpg, slide2.jpg, slide3.jpg
// inside the /public/slides/ folder.

export function HeroSlider() {
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState<boolean[]>(SLIDES.map(() => false));

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 4500);
    return () => clearInterval(t);
  }, []);

  function handleImgError(i: number) {
    setLoaded((prev) => {
      const next = [...prev];
      next[i] = false;
      return next;
    });
  }

  function handleImgLoad(i: number) {
    setLoaded((prev) => {
      const next = [...prev];
      next[i] = true;
      return next;
    });
  }

  return (
    <div className="relative overflow-hidden h-[520px] w-full">
      {SLIDES.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} transition-opacity duration-1000 ${
            i === idx ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Try to load photo; gradient shows if missing */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.image}
            alt=""
            onLoad={() => handleImgLoad(i)}
            onError={() => handleImgError(i)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              loaded[i] ? "opacity-100" : "opacity-0"
            }`}
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/30" />

          {/* Text content */}
          <div className="relative h-full flex flex-col items-center justify-center text-white text-center px-6">
            <div className="text-6xl mb-5 drop-shadow">🏸</div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3 drop-shadow-lg">
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
        {SLIDES.map((_, i) => (
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

      {/* Prev / Next arrows */}
      <button
        onClick={() => setIdx((i) => (i - 1 + SLIDES.length) % SLIDES.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl transition z-10"
        aria-label="Previous slide"
      >
        ‹
      </button>
      <button
        onClick={() => setIdx((i) => (i + 1) % SLIDES.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl transition z-10"
        aria-label="Next slide"
      >
        ›
      </button>
    </div>
  );
}
