import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { db } from "@/lib/supabase";
import { isCoach } from "@/lib/coach-session";
import { coachLogout, deletePlayer, setStatus } from "./actions";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Coach | Sanger Boys Soccer", robots: { index: false } };

async function Dashboard() {
  await connection();
  if (!(await isCoach())) {
    return (
      <div className="max-w-sm">
        <h1 className="mb-4 text-2xl font-bold">Coach sign-in</h1>
        <LoginForm />
      </div>
    );
  }

  const { data: players, error } = await db()
    .from("players")
    .select("id, full_name, grade, jersey_number, positions, email, phone, parent_name, parent_contact, photo_permission, status, created_at, profiles(photo_path, goals_individual, goals_team)")
    .order("jersey_number");
  if (error) throw error;

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Roster submissions ({players?.length ?? 0})</h1>
        <form action={coachLogout}>
          <button className="text-sm underline">Sign out</button>
        </form>
      </div>
      <p className="mb-4 text-sm text-zinc-600">
        Only <b>approved</b> players with photo permission appear on the public Players page.
      </p>
      <ul className="space-y-3">
        {players?.map((p) => {
          const prof = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
          return (
            <li key={p.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <span className="font-semibold">#{p.jersey_number} {p.full_name}</span>
                  <span className="ml-2 text-sm text-zinc-600">
                    Gr. {p.grade} · {p.positions.join(", ")}
                  </span>
                </div>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs">{p.status}</span>
              </div>
              <div className="mt-1 text-sm text-zinc-600">
                {p.email}{p.phone && ` · ${p.phone}`} · Parent: {p.parent_name ?? "-"} {p.parent_contact ?? ""}
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                Photo permission: {p.photo_permission ? "yes" : "no"} · Photo: {prof?.photo_path ? "uploaded" : "missing"}
              </div>
              <div className="mt-3 flex gap-2">
                <form action={setStatus}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="status" value={p.status === "approved" ? "submitted" : "approved"} />
                  <button className="rounded border px-3 py-1 text-sm">{p.status === "approved" ? "Unapprove" : "Approve"}</button>
                </form>
                <form action={setStatus}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="status" value="hidden" />
                  <button className="rounded border px-3 py-1 text-sm">Hide</button>
                </form>
                <form action={deletePlayer}>
                  <input type="hidden" name="id" value={p.id} />
                  <button className="rounded border border-red-300 px-3 py-1 text-sm text-red-700">Delete</button>
                </form>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default function CoachPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <Suspense fallback={<p>Loading…</p>}>
        <Dashboard />
      </Suspense>
    </main>
  );
}
