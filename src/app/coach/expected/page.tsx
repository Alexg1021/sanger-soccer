import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { CoachNav } from "@/components/coach-nav";
import { isMissingTable, requireCoach } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { addExpected, removeExpected } from "../actions";

export const metadata: Metadata = { title: "Expected roster | Coach", robots: { index: false } };

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

async function Body() {
  await connection();
  await requireCoach();
  const supabase = db();
  const [exp, { data: players }] = await Promise.all([
    supabase.from("expected_players").select("id, full_name").order("full_name"),
    supabase.from("players").select("full_name"),
  ]);
  const have = new Set((players ?? []).map((p) => norm(p.full_name)));
  return (
    <>
      <CoachNav />
      <h1 className="mb-1 text-2xl font-bold">Expected roster</h1>
      <p className="mb-6 text-sm text-stone-600">
        Paste your players&apos; full names (one per line). The dashboard uses this to show who hasn&apos;t submitted. Names are matched to the name the player types, so spelling should match.
      </p>
      {isMissingTable(exp.error) ? (
        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">Run <code>supabase/migrations/0002_dashboard.sql</code> in the Supabase SQL editor first.</p>
      ) : (
        <>
          <form action={addExpected} className="mb-8 space-y-2">
            <textarea name="names" rows={6} placeholder={"Jane Doe\nJohn Smith"} className="input" />
            <button className="btn">Add names</button>
          </form>
          <ul className="card divide-y">
            {exp.data?.map((e) => (
              <li key={e.id} className="flex items-center justify-between p-3 text-sm">
                <span>
                  {e.full_name}{" "}
                  <span className={have.has(norm(e.full_name)) ? "text-green-700" : "text-amber-700"}>
                    {have.has(norm(e.full_name)) ? "submitted" : "missing"}
                  </span>
                </span>
                <form action={removeExpected}>
                  <input type="hidden" name="id" value={e.id} />
                  <button className="text-xs text-red-700 underline">Remove</button>
                </form>
              </li>
            ))}
            {!exp.data?.length && <li className="p-3 text-sm text-stone-500">No names yet.</li>}
          </ul>
        </>
      )}
    </>
  );
}

export default function ExpectedPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <Suspense fallback={<p>Loading…</p>}><Body /></Suspense>
    </main>
  );
}
