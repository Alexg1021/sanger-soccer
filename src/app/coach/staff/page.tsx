import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { CoachNav } from "@/components/coach-nav";
import { requireCoach } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { deleteStaff, saveStaff } from "./actions";

export const metadata: Metadata = { title: "Staff | Coach", robots: { index: false } };

type Person = { id?: string; full_name?: string; role?: string; owns?: string | null; email?: string | null; phone?: string | null };

function PersonForm({ p, submit }: { p: Person; submit: string }) {
  return (
    <form action={saveStaff} className="grid gap-2 sm:grid-cols-6">
      {p.id && <input type="hidden" name="id" value={p.id} />}
      <input name="full_name" required placeholder="Name" defaultValue={p.full_name} className="input sm:col-span-2" />
      <input name="role" required placeholder="Role (head coach, manager…)" defaultValue={p.role} className="input sm:col-span-2" />
      <input name="owns" placeholder="Owns (video, social…)" defaultValue={p.owns ?? ""} className="input sm:col-span-2" />
      <input name="email" type="email" placeholder="Email" defaultValue={p.email ?? ""} className="input sm:col-span-3" />
      <input name="phone" type="tel" placeholder="Phone" defaultValue={p.phone ?? ""} className="input sm:col-span-2" />
      <button className="btn-outline sm:col-span-1">{submit}</button>
    </form>
  );
}

async function Body() {
  await connection();
  await requireCoach();
  const { data, error } = await db().from("staff").select("*").order("full_name");
  if (error) throw error;
  return (
    <>
      <CoachNav />
      <h1 className="mb-1 text-2xl font-bold">Coaches &amp; managers</h1>
      <p className="mb-6 text-sm text-stone-600">Assistants see names, roles, and responsibilities here, not contact info.</p>
      <ul className="mb-8 space-y-4">
        {data?.map((p) => (
          <li key={p.id} className="card space-y-2 p-3">
            <PersonForm p={p} submit="Save" />
            <form action={deleteStaff}>
              <input type="hidden" name="id" value={p.id} />
              <button className="text-xs text-red-700 underline">Remove</button>
            </form>
          </li>
        ))}
      </ul>
      <h2 className="mb-2 font-semibold">Add someone</h2>
      <div className="card p-3"><PersonForm p={{}} submit="Add" /></div>
    </>
  );
}

export default function StaffAdminPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <Suspense fallback={<p>Loading…</p>}><Body /></Suspense>
    </main>
  );
}
