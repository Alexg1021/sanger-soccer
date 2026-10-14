import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { publicEvents, dayKey, fmtDay, fmtTime, type PublicEvent } from "@/lib/events";

export const metadata: Metadata = { title: "Schedule | Sanger Boys Soccer" };

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function MonthGrid({ events, month }: { events: PublicEvent[]; month: string }) {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const byDay = new Map<string, PublicEvent[]>();
  for (const e of events) byDay.set(dayKey(e.starts_at), [...(byDay.get(dayKey(e.starts_at)) ?? []), e]);

  const cells: (number | null)[] = [...Array(first.getUTCDay()).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);

  return (
    <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-zinc-200 text-sm">
      {WEEKDAYS.map((d) => (
        <div key={d} className="bg-zinc-100 p-1 text-center font-medium">{d}</div>
      ))}
      {cells.map((day, i) => {
        const list = day ? byDay.get(`${month}-${String(day).padStart(2, "0")}`) ?? [] : [];
        return (
          <div key={i} className="min-h-20 bg-white p-1">
            {day && <div className="text-xs text-zinc-500">{day}</div>}
            {list.map((e) => (
              <div key={e.id} className="mt-0.5 truncate rounded bg-red-100 px-1 text-xs text-red-900" title={e.title}>
                {e.title}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function shiftMonth(month: string, by: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function Schedule({ searchParams }: { searchParams: Promise<{ view?: string; m?: string }> }) {
  await connection();
  const { view, m } = await searchParams;
  const events = await publicEvents();
  const today = dayKey(new Date().toISOString());
  const month = m && /^\d{4}-\d{2}$/.test(m) ? m : today.slice(0, 7);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
        <Link href="/schedule" className={view !== "month" ? "font-semibold underline" : ""}>List</Link>
        <Link href="/schedule?view=month" className={view === "month" ? "font-semibold underline" : ""}>Month</Link>
        <a href="/schedule/ics" className="ml-auto text-red-700 underline">Add to my calendar (.ics)</a>
      </div>

      {view === "month" ? (
        <>
          <div className="mb-3 flex items-center justify-between">
            <Link href={`/schedule?view=month&m=${shiftMonth(month, -1)}`}>&larr; Prev</Link>
            <h2 className="font-semibold">{month}</h2>
            <Link href={`/schedule?view=month&m=${shiftMonth(month, 1)}`}>Next &rarr;</Link>
          </div>
          <MonthGrid events={events} month={month} />
        </>
      ) : events.length === 0 ? (
        <p className="text-zinc-600">No events posted yet.</p>
      ) : (
        <ul className="divide-y">
          {events.map((e) => (
            <li key={e.id} className={`py-3 ${dayKey(e.starts_at) < today ? "opacity-50" : ""}`}>
              <div className="font-medium">{e.title}</div>
              <div className="text-sm text-zinc-600">
                {fmtDay(e.starts_at)}
                {!e.all_day && ` · ${fmtTime(e.starts_at)}`}
                {e.location && ` · ${e.location}`}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function SchedulePage({ searchParams }: PageProps<"/schedule">) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">Sanger Varsity Boys Soccer: Schedule</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <Schedule searchParams={searchParams as Promise<{ view?: string; m?: string }>} />
      </Suspense>
    </main>
  );
}
