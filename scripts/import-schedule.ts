// Usage: npx tsx scripts/import-schedule.ts <file.csv> [--dry-run] [--replace]
// Re-running updates existing events. --replace also deletes events no longer in the CSV
// (use it when an opponent changes from TBD to a real name, so the old row doesn't linger).
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { existsSync } from "node:fs";
import { parseSchedule, looksLikeSeasonSheet, TZ } from "../src/lib/schedule-csv";
import { parseSangerSheet } from "../src/lib/schedule-sanger";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const [file, ...flags] = process.argv.slice(2);
if (!file) {
  console.error("Usage: npx tsx scripts/import-schedule.ts <file.csv> [--dry-run]");
  process.exit(1);
}

const csv = readFileSync(file, "utf8");
const { events, problems } = looksLikeSeasonSheet(csv) ? parseSangerSheet(csv) : parseSchedule(csv);
problems.forEach((p) => console.warn("warning:", p));

const fmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
});
for (const e of events) {
  console.log(`${e.all_day ? fmt.format(new Date(e.starts_at)).replace(/, \d.*$/, "") + " (all day)" : fmt.format(new Date(e.starts_at))} | ${e.type} | ${e.title} | ${e.location ?? "-"} | ${e.visibility}`);
}
console.log(`\n${events.length} events parsed, ${problems.length} warnings`);

if (flags.includes("--dry-run")) process.exit(0);

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or use --dry-run).");
  process.exit(1);
}
async function main() {
  const supabase = createClient(url!, key!, { auth: { persistSession: false } });

  // Events edited by hand in the dashboard are left alone. (Column exists after migration 0002.)
  const { data: edited, error: editedErr } = await supabase.from("events").select("source_key").eq("manually_edited", true);
  const protectedKeys = new Set((edited ?? []).map((e) => e.source_key).filter(Boolean));
  if (editedErr) console.warn("note: couldn't check manually edited events (run migration 0002?):", editedErr.message);
  const toWrite = events.filter((e) => !protectedKeys.has(e.source_key));
  if (protectedKeys.size) console.log(`Skipping ${events.length - toWrite.length} hand-edited event(s).`);

  const { error } = await supabase.from("events").upsert(toWrite, { onConflict: "source_key" });
  if (error) {
    console.error("Import failed:", error.message);
    process.exit(1);
  }
  console.log("Imported.");
  if (flags.includes("--replace")) {
    const keep = [...events.map((e) => e.source_key), ...protectedKeys];
    const { data, error: delErr } = await supabase
      .from("events")
      .delete()
      .not("source_key", "in", `(${keep.join(",")})`)
      .select("id");
    if (delErr) console.error("Cleanup failed:", delErr.message);
    else console.log(`Removed ${data?.length ?? 0} events no longer in the CSV.`);
  }
}
main();
