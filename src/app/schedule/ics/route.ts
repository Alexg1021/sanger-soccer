import { connection } from "next/server";
import { publicEvents } from "@/lib/events";

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const dateOnly = (iso: string) => stamp(iso).slice(0, 8);

export async function GET() {
  await connection();
  const events = await publicEvents();
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sanger Boys Soccer//Schedule//EN",
    "X-WR-CALNAME:Sanger Varsity Boys Soccer",
    "X-WR-TIMEZONE:America/Los_Angeles",
  ];
  for (const e of events) {
    lines.push("BEGIN:VEVENT", `UID:${e.id}@sanger-soccer`, `DTSTAMP:${stamp(new Date().toISOString())}`);
    if (e.all_day) {
      // Pacific midnight is 07:00 or 08:00 UTC the same day, so the UTC date matches the local date.
      lines.push(`DTSTART;VALUE=DATE:${dateOnly(e.starts_at)}`);
    } else {
      const end = e.ends_at ?? new Date(new Date(e.starts_at).getTime() + 2 * 3600 * 1000).toISOString();
      lines.push(`DTSTART:${stamp(e.starts_at)}`, `DTEND:${stamp(end)}`);
    }
    lines.push(`SUMMARY:${esc(e.title)}`);
    if (e.location) lines.push(`LOCATION:${esc(e.location)}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return new Response(lines.join("\r\n") + "\r\n", {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "public, max-age=900" },
  });
}
