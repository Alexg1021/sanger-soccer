import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const TTL_MS = 7 * 24 * 3600 * 1000;

const sign = (payload: string) => createHmac("sha256", process.env.SESSION_SECRET ?? "").update(payload).digest("hex");

export function sameSecret(input: string, expected: string | undefined): boolean {
  if (!expected) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function startSession(name: string, ttlMs = TTL_MS) {
  const exp = String(Date.now() + ttlMs);
  (await cookies()).set(name, `${exp}.${sign(`${name}.${exp}`)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ttlMs / 1000,
  });
}

export async function endSession(name: string) {
  (await cookies()).delete(name);
}

export async function hasSession(name: string): Promise<boolean> {
  if (!process.env.SESSION_SECRET) return false;
  const raw = (await cookies()).get(name)?.value;
  if (!raw) return false;
  const [exp, sig] = raw.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return sameSecret(sig, sign(`${name}.${exp}`)); // cookie name is signed in, so a team cookie can't act as a coach cookie
}
