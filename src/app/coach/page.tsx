import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { CoachNav } from "@/components/coach-nav";
import { getRole, isMissingTable } from "@/lib/auth";
import { dayKey, fmtDay } from "@/lib/events";
import { db } from "@/lib/supabase";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Coach | Sanger Boys Soccer", robots: { index: false } };

type Prof = { photo_path: string | null; bio: string | null; goals_individual: string | null; goals_team: string | null };
type Row = {
  id: string; full_name: string; grade: number | null; jersey_number: number | null; positions: string[];
  status: string; created_at: string; profiles: Prof | Prof[] | null;
};

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
const SORTS: Record<string, (a: Row, b: Row) => number> = {
  jersey: (a, b) => (a.jersey_number ?? 999) - (b.jersey_number ?? 999),
  name: (a, b) => a.full_name.localeCompare(b.full_name),
  grade: (a, b) => (b.grade ?? 0) - (a.grade ?? 0),
  status: (a, b) => a.status.localeCompare(b.status),
};

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="card p-4">
      <div className="text-2xl font-bold text-brand">{value}</div>
      <div className="text-sm font-medium">{label}</div>
      {hint && <div className="text-xs text-stone-500">{hint}</div>}
    </div>
  );
}

async function Dashboard({ searchParams }: { searchParams: Promise<{ sort?: string; status?: string }> }) {
  await connection();
  const role = await getRole();
  if (role === "assistant") {
    return (
      <p>
        You&apos;re signed in as an assistant. <Link className="underline" href="/staff">Go to the staff area</Link>.
      </p>
    );
  }
  if (!role) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-bold">Staff sign-in</h1>
        <LoginForm />
      </div>
    );
  }

  const { sort = "jersey", status } = await searchParams;
  const supabase = db();
  const [{ data, error }, expectedRes, { data: events }] = await Promise.all([
    supabase.from("players").select("id, full_name, grade, jersey_number, positions, status, created_at, profiles(photo_path, bio, goals_individual, goals_team)"),
    supabase.from("expected_players").select("id, full_name"),
    supabase.from("events").select("title, starts_at").gte("starts_at", new Date(Date.now() - 12 * 3600 * 1000).toISOString()).order("starts_at").limit(1),
  ]);
  if (error) throw error;

  const players = (data ?? []) as unknown as Row[];
  const migrationNeeded = isMissingTable(expectedRes.error);
  const expected = expectedRes.data ?? [];
  const have = new Set(players.map((p) => norm(p.full_name)));
  const missing = expected.filter((e) => !have.has(norm(e.full_name)));

  const prof = (p: Row) => (Array.isArray(p.profiles) ? p.profiles[0] : p.profiles);
  const noPhoto = players.filter((p) => !prof(p)?.photo_path).length;
  const approved = players.filter((p) => p.status === "approved").length;
  const next = events?.[0];
  const daysTo = next ? Math.round((Date.parse(dayKey(next.starts_at)) - Date.parse(dayKey(new Date().toISOString()))) / 86400000) : null;

  const rows = players.filter((p) => !status || p.status === status).sort(SORTS[sort] ?? SORTS.jersey);
  const th = (key: string, label: string) => (
    <th className="px-3 py-2 text-left">
      <Link href={`/coach?sort=${key}${status ? `&status=${status}` : ""}`} className={sort === key ? "underline" : ""}>{label}</Link>
    </th>
  );

  return (
    <>
      <CoachNav />
      <h1 className="mb-4 text-2xl font-bold">Dashboard</h1>
      {migrationNeeded && (
        <p className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
          One-time setup: run <code>supabase/migrations/0002_dashboard.sql</code> in the Supabase SQL editor to enable the expected roster, manual adds, and event edit protection.
        </p>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Profiles in" value={expected.length ? `${expected.length - missing.length} / ${expected.length}` : players.length} hint={expected.length ? "of expected roster" : "add an expected roster"} />
        <Stat label="Approved" value={`${approved} / ${players.length}`} hint="shown publicly" />
        <Stat label="Missing photo" value={noPhoto} />
        <Stat label="Next event" value={daysTo === null ? "-" : daysTo <= 0 ? "Today" : `${daysTo}d`} hint={next ? `${next.title} · ${fmtDay(next.starts_at)}` : "none scheduled"} />
      </div>

      {missing.length > 0 && (
        <section className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h2 className="font-semibold">Haven&apos;t submitted ({missing.length})</h2>
          <p className="mt-1 text-sm">{missing.map((m) => m.full_name).join(", ")}</p>
        </section>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
        <Link href="/coach/players/new" className="btn">Add player</Link>
        <a href="/coach/export" className="btn-outline">Export contacts (CSV)</a>
        <span className="ml-auto flex gap-3">
          Show:
          {[undefined, "submitted", "approved", "hidden"].map((s) => (
            <Link key={s ?? "all"} href={`/coach?sort=${sort}${s ? `&status=${s}` : ""}`} className={status === s ? "font-semibold underline" : ""}>
              {s ?? "all"}
            </Link>
          ))}
        </span>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-stone-50">
            <tr>{th("jersey", "#")}{th("name", "Name")}{th("grade", "Gr")}<th className="px-3 py-2 text-left">Pos</th>{th("status", "Status")}<th className="px-3 py-2 text-left">Profile</th></tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const pr = prof(p);
              const done = pr?.photo_path && pr.bio && pr.goals_individual && pr.goals_team;
              return (
                <tr key={p.id} className="border-b last:border-0 hover:bg-stone-50">
                  <td className="px-3 py-2">{p.jersey_number ?? "-"}</td>
                  <td className="px-3 py-2 font-medium"><Link className="text-brand hover:underline" href={`/coach/players/${p.id}`}>{p.full_name}</Link></td>
                  <td className="px-3 py-2">{p.grade ?? "-"}</td>
                  <td className="px-3 py-2">{p.positions.join(", ")}</td>
                  <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-xs ${p.status === "approved" ? "bg-green-100 text-green-800" : "bg-stone-100"}`}>{p.status}</span></td>
                  <td className="px-3 py-2 text-xs">{done ? "complete" : <span className="text-amber-700">incomplete</span>}</td>
                </tr>
              );
            })}
            {!rows.length && <tr><td colSpan={6} className="px-3 py-6 text-center text-stone-500">No players yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function CoachPage({ searchParams }: PageProps<"/coach">) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <Suspense fallback={<p>Loading…</p>}>
        <Dashboard searchParams={searchParams as Promise<{ sort?: string; status?: string }>} />
      </Suspense>
    </main>
  );
}
