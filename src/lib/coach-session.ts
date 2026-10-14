import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "coach_session";
const TTL_MS = 7 * 24 * 3600 * 1000;

const sign = (payload: string) => createHmac("sha256", process.env.SESSION_SECRET ?? "").update(payload).digest("hex");

export function passcodeMatches(input: string): boolean {
  const expected = process.env.COACH_PASSCODE;
  if (!expected || !process.env.SESSION_SECRET) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function startCoachSession() {
  const exp = String(Date.now() + TTL_MS);
  (await cookies()).set(COOKIE, `${exp}.${sign(exp)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TTL_MS / 1000,
  });
}

export async function endCoachSession() {
  (await cookies()).delete(COOKIE);
}

export async function isCoach(): Promise<boolean> {
  if (!process.env.SESSION_SECRET) return false;
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return false;
  const [exp, sig] = raw.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const good = Buffer.from(sign(exp));
  const got = Buffer.from(sig);
  return good.length === got.length && timingSafeEqual(good, got);
}
