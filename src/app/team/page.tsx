import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { dayKey, fmtDay, fmtTime, teamEvents } from "@/lib/events";
import { isTeamMember } from "@/lib/team-session";
import { teamLogout } from "./actions";
import { CodeForm } from "./code-form";

export const metadata: Metadata = { title: "Team schedule | Sanger Boys Soccer", robots: { index: false } };

async function TeamSchedule() {
  await connection();
  if (!(await isTeamMember())) {
    return (
      <>
        <h1 className="mb-2 text-2xl font-bold">Team schedule</h1>
        <p className="mb-4 text-zinc-600">Enter the team code from the team chat.</p>
        <CodeForm />
      </>
    );
  }

  const events = await teamEvents();
  const today = dayKey(new Date().toISOString());
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Team schedule</h1>
        <form action={teamLogout}>
          <button className="text-sm underline">Leave</button>
        </form>
      </div>
      <ul className="divide-y">
        {events.map((e) => (
          <li key={e.id} className={`py-3 ${dayKey(e.starts_at) < today ? "opacity-50" : ""}`}>
            <div className="font-medium">{e.title}</div>
            <div className="text-sm text-zinc-600">
              {fmtDay(e.starts_at)}
              {!e.all_day && ` · ${fmtTime(e.starts_at)}`}
              {e.location && ` · ${e.location}`}
            </div>
            {e.notes && <div className="mt-1 text-sm text-zinc-800">{e.notes}</div>}
          </li>
        ))}
      </ul>
    </>
  );
}

export default function TeamPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <Suspense fallback={<p>Loading…</p>}>
        <TeamSchedule />
      </Suspense>
    </main>
  );
}
