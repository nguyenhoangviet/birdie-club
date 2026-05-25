import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import type { SessionData } from "@/lib/session";

const PUBLIC_PATHS = [
  "/login",
  "/api/auth/send-otp",
  "/api/auth/verify-otp",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic =
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon");

  if (isPublic) return NextResponse.next();

  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(req, res, {
    password: process.env.SESSION_SECRET as string,
    cookieName: "birdie-club-session",
  });

  if (!session.isLoggedIn || !session.email) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
