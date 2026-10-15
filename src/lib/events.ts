import { db } from "./supabase";
import { TZ } from "./schedule-csv";

export type PublicEvent = {
  id: string;
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  type: string;
  title: string;
  location: string | null;
};

/** Public view: only public events, and never the internal notes column. */
export async function publicEvents(): Promise<PublicEvent[]> {
  const { data, error } = await db()
    .from("events")
    .select("id, starts_at, ends_at, all_day, type, title, location")
    .eq("visibility", "public")
    .order("starts_at");
  if (error) throw error;
  return data ?? [];
}

export const dayKey = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));

export const fmtTime = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" }).format(new Date(iso));

export const fmtDay = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short", month: "short", day: "numeric" }).format(new Date(iso));

export type TeamEvent = PublicEvent & { notes: string | null };

/** Team view: public + team-only events, including notes. Call only after checking isTeamMember(). */
export async function teamEvents(): Promise<TeamEvent[]> {
  const { data, error } = await db()
    .from("events")
    .select("id, starts_at, ends_at, all_day, type, title, location, notes")
    .in("visibility", ["public", "team"])
    .order("starts_at");
  if (error) throw error;
  return data ?? [];
}

/** Pacific date ("2026-12-02") and time ("15:30") parts for form inputs. */
export function pacificParts(iso: string) {
  const d = new Date(iso);
  const time = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);
  return { date: dayKey(iso), time };
}

/** Staff view: every event regardless of visibility. Call only after checking the staff role. */
export async function staffEvents(): Promise<TeamEvent[]> {
  const { data, error } = await db()
    .from("events")
    .select("id, starts_at, ends_at, all_day, type, title, location, notes")
    .order("starts_at");
  if (error) throw error;
  return data ?? [];
}
