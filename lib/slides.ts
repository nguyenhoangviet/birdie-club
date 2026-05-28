export interface Slide {
  title: string;
  sub: string;
  imageUrl?: string;
  gradient: string;
  isEvent?: boolean;
  duration?: number; // ms, default 4500
}

export const DEFAULT_SLIDES: Slide[] = [
  {
    title: "Welcome to The Birdie Club",
    sub: "Professional badminton coaching for all levels",
    imageUrl: "",
    gradient: "from-green-900 via-green-700 to-emerald-600",
  },
  {
    title: "Train With the Best",
    sub: "1-on-1 sessions tailored to your skill level",
    imageUrl: "",
    gradient: "from-teal-900 via-teal-700 to-cyan-600",
  },
  {
    title: "Join Our Community",
    sub: "Meet fellow players and improve together",
    imageUrl: "",
    gradient: "from-emerald-900 via-green-800 to-lime-700",
  },
];
