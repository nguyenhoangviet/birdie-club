import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  email: string;
  isLoggedIn: boolean;
}

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "birdie-club-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );
  return session;
}
