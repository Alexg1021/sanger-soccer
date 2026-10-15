import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { CoachNav } from "@/components/coach-nav";
import { requireCoach } from "@/lib/auth";
import { dayKey, fmtDay, fmtTime } from "@/lib/events";
import { db } from "@/lib/supabase";

export const metadata: Metadata = { title: "Events | Coach", robots: { index: false } };

async function Body() {
  await connection();
  await requireCoach();
  const { data, error } = await db().from("events").select("id, title, type, starts_at, all_day, location, visibility, notes").order("starts_at");
  if (error) throw error;
  const today = dayKey(new Date().toISOString());
  return (
    <>
      <CoachNav />
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Events ({data?.length ?? 0})</h1>
        <Link href="/coach/events/new" className="btn">Add event</Link>
      </div>
      <ul className="card divide-y">
        {data?.map((e) => (
          <li key={e.id} className={`flex flex-wrap items-center gap-x-4 gap-y-1 p-3 ${dayKey(e.starts_at) < today ? "opacity-50" : ""}`}>
            <div className="min-w-0 flex-1">
              <Link href={`/coach/events/${e.id}`} className="font-medium text-brand hover:underline">{e.title}</Link>
              <div className="text-sm text-stone-600">
                {fmtDay(e.starts_at)}{!e.all_day && ` · ${fmtTime(e.starts_at)}`}{e.location && ` · ${e.location}`}
              </div>
            </div>
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs">{e.visibility}</span>
            {e.notes && <span className="text-xs text-stone-500">notes</span>}
          </li>
        ))}
      </ul>
    </>
  );
}

export default function EventsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Suspense fallback={<p>Loading…</p>}><Body /></Suspense>
    </main>
  );
}
