import { parse } from "csv-parse/sync";
import { createHash } from "node:crypto";

export const TZ = "America/Los_Angeles";

export type EventRow = {
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  type: "game" | "practice" | "showcase" | "meeting" | "travel" | "other";
  title: string;
  location: string | null;
  notes: string | null;
  visibility: "public" | "team" | "staff";
  source_key: string;
};

const ALIASES: Record<string, string[]> = {
  date: ["date", "day", "game date"],
  time: ["time", "start", "start time", "start_time"],
  end: ["end", "end time", "end_time"],
  title: ["title", "event", "opponent", "game", "vs", "description"],
  location: ["location", "where", "venue", "site", "field"],
  type: ["type", "category", "kind"],
  notes: ["notes", "note", "details", "comments"],
  visibility: ["visibility", "audience", "public"],
};

const norm = (s: string) => s.trim().toLowerCase();

function pick(row: Record<string, string>, field: keyof typeof ALIASES): string {
  for (const a of ALIASES[field]) {
    for (const k of Object.keys(row)) if (norm(k) === a && row[k]?.trim()) return row[k].trim();
  }
  return "";
}

/** Offset (ms) of the Pacific zone from UTC at the given instant. */
function tzOffsetMs(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(at);
  const g = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const asUtc = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"), g("second"));
  return asUtc - at.getTime();
}

/** Interpret y-m-d h:mi as Pacific wall-clock time and return the real instant. */
export function pacificToDate(y: number, m: number, d: number, h = 0, mi = 0): Date {
  const guess = Date.UTC(y, m - 1, d, h, mi);
  const first = guess - tzOffsetMs(new Date(guess));
  return new Date(guess - tzOffsetMs(new Date(first)));
}

function parseDate(s: string): [number, number, number] | null {
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return [+m[1], +m[2], +m[3]];
  m = s.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  if (m) {
    const yr = m[3] ? (+m[3] < 100 ? 2000 + +m[3] : +m[3]) : new Date().getFullYear();
    return [yr, +m[1], +m[2]];
  }
  return null;
}

function parseTime(s: string): [number, number] | null {
  const m = s.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a|p)?$/i);
  if (!m) return null;
  let h = +m[1];
  const mi = m[2] ? +m[2] : 0;
  const ap = m[3]?.toLowerCase();
  if (ap?.startsWith("p") && h < 12) h += 12;
  if (ap?.startsWith("a") && h === 12) h = 0;
  return h > 23 || mi > 59 ? null : [h, mi];
}

function guessType(title: string, explicit: string): EventRow["type"] {
  const t = norm(explicit || title);
  if (/showcase|tournament/.test(t)) return "showcase";
  if (/practice|training|scrimmage/.test(t)) return explicit ? "practice" : "practice";
  if (/meeting|parent/.test(t)) return "meeting";
  if (/travel|bus/.test(t)) return "travel";
  if (/game|match|vs\.?|@/.test(t) || explicit === "") return "game";
  return "other";
}

export function parseSchedule(csv: string): { events: EventRow[]; problems: string[] } {
  const rows: Record<string, string>[] = parse(csv, { columns: true, skip_empty_lines: true, trim: true, bom: true });
  const events: EventRow[] = [];
  const problems: string[] = [];

  rows.forEach((row, i) => {
    const line = i + 2; // header is line 1
    const title = pick(row, "title");
    const dateStr = pick(row, "date");
    const d = parseDate(dateStr);
    if (!title || !d) {
      problems.push(`Line ${line}: need a title and a date (got title="${title}", date="${dateStr}")`);
      return;
    }
    const timeStr = pick(row, "time");
    const t = timeStr ? parseTime(timeStr) : null;
    if (timeStr && !t) problems.push(`Line ${line}: couldn't read time "${timeStr}", treating as all-day`);
    const endStr = pick(row, "end");
    const e = endStr ? parseTime(endStr) : null;

    const starts = pacificToDate(d[0], d[1], d[2], t?.[0] ?? 0, t?.[1] ?? 0);
    const ends = t && e ? pacificToDate(d[0], d[1], d[2], e[0], e[1]) : null;
    const vis = norm(pick(row, "visibility"));
    const visibility: EventRow["visibility"] = vis === "team" || vis === "staff" ? vis : "public";
    const type = guessType(title, norm(pick(row, "type")));

    events.push({
      starts_at: starts.toISOString(),
      ends_at: ends && ends > starts ? ends.toISOString() : null,
      all_day: !t,
      type,
      title,
      location: pick(row, "location") || null,
      notes: pick(row, "notes") || null,
      visibility,
      // Same date + title = same event, so re-importing the sheet updates rather than duplicates.
      source_key: createHash("sha1").update(`${d.join("-")}|${norm(title)}`).digest("hex").slice(0, 16),
    });
  });

  return { events, problems };
}

/** Picks the right parser: the program's season sheet has a "Teams" header column. */
export function looksLikeSeasonSheet(csv: string): boolean {
  return csv.split(/\r?\n/).slice(0, 12).some((l) => /(^|,)\s*teams\s*(,|$)/i.test(l));
}
