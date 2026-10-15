import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { staffLogout } from "@/app/coach/actions";
import { requireStaff } from "@/lib/auth";
import { dayKey, fmtDay, fmtTime, staffEvents } from "@/lib/events";
import { db } from "@/lib/supabase";

export const metadata: Metadata = { title: "Staff area | Sanger Boys Soccer", robots: { index: false } };

type Prof = { bio: string | null; strengths: string | null; working_on: string | null; goals_individual: string | null; goals_team: string | null; goals_from_coaches: string | null };

async function Body() {
  await connection();
  const role = await requireStaff();
  const supabase = db();
  // Explicit column list: assistants never receive emails, phones, or parent info.
  const [{ data: players, error }, { data: staff }, events] = await Promise.all([
    supabase
      .from("players")
      .select("id, full_name, preferred_name, grade, jersey_number, positions, profiles(bio, strengths, working_on, goals_individual, goals_team, goals_from_coaches)")
      .neq("status", "hidden")
      .order("jersey_number"),
    supabase.from("staff").select("id, full_name, role, owns").order("full_name"),
    staffEvents(),
  ]);
  if (error) throw error;
  const today = dayKey(new Date().toISOString());
  const upcoming = events.filter((e) => dayKey(e.starts_at) >= today).slice(0, 12);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Staff area</h1>
        <div className="flex gap-4 text-sm">
          {role === "coach" && <Link href="/coach" className="underline">Coach dashboard</Link>}
          <form action={staffLogout}><button className="underline">Sign out</button></form>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="mb-2 font-semibold">Coming up</h2>
        <ul className="card divide-y">
          {upcoming.map((e) => (
            <li key={e.id} className="p-3">
              <div className="font-medium">{e.title}</div>
              <div className="text-sm text-stone-600">{fmtDay(e.starts_at)}{!e.all_day && ` · ${fmtTime(e.starts_at)}`}{e.location && ` · ${e.location}`}</div>
              {e.notes && <div className="mt-1 text-sm">{e.notes}</div>}
            </li>
          ))}
          {!upcoming.length && <li className="p-3 text-sm text-stone-500">Nothing scheduled.</li>}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 font-semibold">Roster ({players?.length ?? 0})</h2>
        <ul className="space-y-2">
          {(players as unknown as (Record<string, unknown> & { id: string; full_name: string; grade: number | null; jersey_number: number | null; positions: string[]; profiles: Prof | Prof[] | null })[])?.map((p) => {
            const pr = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
            const rows: [string, string | null | undefined][] = [
              ["Bio", pr?.bio], ["Strengths", pr?.strengths], ["Working on", pr?.working_on],
              ["Personal goals", pr?.goals_individual], ["Team goals", pr?.goals_team], ["Wants from coaches", pr?.goals_from_coaches],
            ];
            return (
              <li key={p.id} className="card">
                <details className="p-3">
                  <summary className="cursor-pointer font-medium">
                    #{p.jersey_number ?? "-"} {p.full_name}
                    <span className="ml-2 text-sm font-normal text-stone-600">Gr. {p.grade ?? "-"} · {p.positions.join(", ")}</span>
                  </summary>
                  <dl className="mt-3 space-y-2 text-sm">
                    {rows.map(([k, v]) => v ? <div key={k}><dt className="font-medium">{k}</dt><dd className="whitespace-pre-line text-stone-700">{v}</dd></div> : null)}
                    {!rows.some(([, v]) => v) && <p className="text-stone-500">No profile yet.</p>}
                  </dl>
                </details>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Coaches &amp; managers</h2>
        <ul className="card divide-y">
          {staff?.map((s) => (
            <li key={s.id} className="p-3 text-sm">
              <span className="font-medium">{s.full_name}</span> · {s.role}{s.owns && <span className="text-stone-600"> · {s.owns}</span>}
            </li>
          ))}
          {!staff?.length && <li className="p-3 text-sm text-stone-500">No staff listed yet.</li>}
        </ul>
      </section>
    </>
  );
}

export default function StaffAreaPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Suspense fallback={<p>Loading…</p>}><Body /></Suspense>
    </main>
  );
}
