import { parse } from "csv-parse/sync";
import { createHash } from "node:crypto";
import { pacificToDate, type EventRow } from "./schedule-csv";

/**
 * Parser for the program's season sheet:
 *   title rows, then "Date,Day,Time,School,Location,Teams,Type,<notes>"
 *   dates like "11/12" or "11/20 - 11/22" (no year), times like "3:00/5:30pm" (JV/V),
 *   a Teams column (JV, V, JV/V), and footer rows such as "CIF Central Section Playoffs: 2/14, 2/18".
 * Varsity only: rows for JV alone are skipped.
 */

const SEASON_START_YEAR = 2026; // Aug-Dec = this year, Jan-Jul = next
const yearFor = (month: number) => (month >= 8 ? SEASON_START_YEAR : SEASON_START_YEAR + 1);

const LOCATION_ALIASES: Record<string, string> = { TW: "Tulare Western" };
const SCHOOL_ALIASES: Record<string, string> = { MCS: "Mission City Showcase" };
const isHome = (loc: string) => /^sanger/i.test(loc);

type Md = [number, number]; // month, day

function parseMd(s: string): Md | null {
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})$/);
  return m ? [+m[1], +m[2]] : null;
}

/** "11/20", "11/20 - 11/22" -> [start, end?] */
function parseDateCell(s: string): { start: Md; end?: Md } | null {
  const parts = s.split(/\s*[-–]\s*/).map(parseMd);
  if (!parts[0]) return null;
  return { start: parts[0], end: parts[1] ?? undefined };
}

/** Varsity time from "5:00 PM", "3:00/5:30pm" (JV/V), "TBD", "". Returns null when unknown. */
function varsityTime(raw: string): [number, number] | null {
  const parts = raw.split("/").map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return null;
  const last = parts[parts.length - 1];
  const suffix = last.match(/(am|pm)$/i)?.[1]?.toLowerCase();
  const m = last.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!m) return null;
  let h = +m[1];
  const mi = m[2] ? +m[2] : 0;
  const ap = (m[3] ?? suffix)?.toLowerCase() ?? (h >= 1 && h <= 7 ? "pm" : undefined);
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  return [h, mi];
}

const key = (...parts: string[]) =>
  createHash("sha1").update(parts.join("|").toLowerCase()).digest("hex").slice(0, 16);

function toInstant(md: Md, time: [number, number] | null): Date {
  return pacificToDate(yearFor(md[0]), md[0], md[1], time?.[0] ?? 0, time?.[1] ?? 0);
}

export function parseSangerSheet(csv: string): { events: EventRow[]; problems: string[] } {
  const rows: string[][] = parse(csv, { columns: false, skip_empty_lines: false, relax_column_count: true, trim: true, bom: true });
  const problems: string[] = [];
  const events: EventRow[] = [];

  const headerIdx = rows.findIndex((r) => r[0]?.toLowerCase() === "date" && r.some((c) => c.toLowerCase() === "teams"));
  if (headerIdx < 0) return { events, problems: ["Couldn't find the header row (Date ... Teams ...)"] };

  let undated = 0;

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    const [dateCell, , timeCell = "", schoolRaw = "", locationCell = "", teams = "", type = "", note = ""] = r;
    const school = SCHOOL_ALIASES[schoolRaw] ?? schoolRaw;
    const line = i + 1;

    // Footer rows: "CIF Central Section Playoffs: 2/14, 2/18, 2/24 - 2/26"
    const footer = r.map((c) => c.match(/^(.+?):\s*((?:\d{1,2}\/\d{1,2}(?:\s*[-–]\s*\d{1,2}\/\d{1,2})?(?:,\s*)?)+)$/)).find(Boolean);
    if (footer) {
      for (const chunk of footer[2].split(",").map((s) => s.trim()).filter(Boolean)) {
        const d = parseDateCell(chunk);
        if (!d) continue;
        events.push({
          starts_at: toInstant(d.start, null).toISOString(),
          ends_at: d.end ? toInstant(d.end, null).toISOString() : null,
          all_day: true,
          type: "game",
          title: footer[1],
          location: null,
          notes: null,
          visibility: "public",
          source_key: key(String(d.start), footer[1]),
        });
      }
      continue;
    }

    if (!dateCell) {
      if (teams || type) undated++; // e.g. CMAC league rows waiting on dates
      continue;
    }

    const d = parseDateCell(dateCell);
    if (!d) {
      problems.push(`Line ${line}: couldn't read date "${dateCell}"`);
      continue;
    }

    const teamSet = teams.split("/").map((t) => t.trim().toUpperCase());
    if (!teamSet.includes("V")) continue; // JV-only rows, Thanksgiving ("--"), etc.

    const loc = LOCATION_ALIASES[locationCell] ?? (locationCell.toUpperCase() === "TBD" ? "" : locationCell);
    const time = varsityTime(timeCell);
    const isEventName = /showcase|tournament/i.test(school) || school.toLowerCase() === type.toLowerCase();

    let title: string;
    if (!school) title = `${type || "Game"} (opponent TBD)`;
    else if (isEventName || /tournament/i.test(type)) title = school;
    else title = `${loc && !isHome(loc) ? "@" : "vs."} ${school}`; // "@" only when we know it is away

    const kind: EventRow["type"] = /showcase|tournament/i.test(`${type} ${school}`) ? "showcase" : "game";

    events.push({
      starts_at: toInstant(d.start, time).toISOString(),
      ends_at: d.end ? toInstant(d.end, null).toISOString() : null,
      all_day: !time || !!d.end,
      type: kind,
      title,
      location: loc || null,
      notes: note || null,
      visibility: "public",
      source_key: key(String(d.start), type, school || "tbd"),
    });
  }

  if (undated) problems.push(`${undated} row(s) have a type/team but no date yet (e.g. CMAC league games). Add dates to the sheet and re-import.`);
  return { events, problems };
}
