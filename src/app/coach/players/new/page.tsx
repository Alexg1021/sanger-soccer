import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { CoachNav } from "@/components/coach-nav";
import { requireCoach } from "@/lib/auth";
import { savePlayer } from "../actions";
import { PlayerForm } from "../player-form";

export const metadata: Metadata = { title: "Add player | Coach", robots: { index: false } };

async function Body() {
  await connection();
  await requireCoach();
  return (
    <>
      <CoachNav />
      <Link href="/coach" className="text-sm underline">&larr; Dashboard</Link>
      <h1 className="my-4 text-2xl font-bold">Add player</h1>
      <PlayerForm action={savePlayer.bind(null, null)} defaults={{ status: "submitted" }} />
    </>
  );
}

export default function NewPlayerPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Suspense fallback={<p>Loading…</p>}><Body /></Suspense>
    </main>
  );
}
