import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { CoachNav } from "@/components/coach-nav";
import { requireCoach } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { deletePlayer, setStatus } from "../../actions";
import { savePlayer } from "../actions";
import { PlayerForm } from "../player-form";

export const metadata: Metadata = { title: "Player | Coach", robots: { index: false } };

async function Body({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  await connection();
  await requireCoach();
  const { id } = await params;
  const { saved } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = db();
  const { data: p, error } = await supabase.from("players").select("*, profiles(*)").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!p) notFound();
  const pr = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;

  let photoUrl: string | null = null;
  if (pr?.photo_path) {
    const { data } = await supabase.storage.from("player-photos").createSignedUrl(pr.photo_path, 3600);
    photoUrl = data?.signedUrl ?? null;
  }

  return (
    <>
      <CoachNav />
      <Link href="/coach" className="text-sm underline">&larr; Dashboard</Link>
      <div className="my-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{p.full_name}</h1>
        <div className="flex gap-2">
          <form action={setStatus}>
            <input type="hidden" name="id" value={p.id} />
            <input type="hidden" name="status" value={p.status === "approved" ? "submitted" : "approved"} />
            <button className="btn-outline">{p.status === "approved" ? "Unapprove" : "Approve"}</button>
          </form>
          <form action={deletePlayer}>
            <input type="hidden" name="id" value={p.id} />
            <button className="btn-outline btn-danger">Delete</button>
          </form>
        </div>
      </div>
      {saved && <p className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800">Saved.</p>}
      <p className="mb-6 text-sm text-stone-600">Public page: {p.status === "approved" && p.photo_permission ? <Link className="underline" href={`/players/${p.id}`}>visible</Link> : "not visible (needs approved status and photo permission)"}</p>
      <PlayerForm
        action={savePlayer.bind(null, p.id)}
        defaults={{
          fullName: p.full_name, preferredName: p.preferred_name ?? "", grade: p.grade ?? undefined, jerseyNumber: p.jersey_number ?? undefined,
          positions: p.positions ?? [], email: p.email ?? "", phone: p.phone ?? "", parentName: p.parent_name ?? "",
          parentContact: p.parent_contact ?? "", socialHandle: p.social_handle ?? "", photoPermission: p.photo_permission, status: p.status,
          bio: pr?.bio ?? "", yearsPlaying: pr?.years_playing ?? "", previousTeams: pr?.previous_teams ?? "", strengths: pr?.strengths ?? "",
          workingOn: pr?.working_on ?? "", whyIPlay: pr?.why_i_play ?? "", funFact: pr?.fun_fact ?? "", afterHsPlans: pr?.after_hs_plans ?? "",
          goalsIndividual: pr?.goals_individual ?? "", goalsTeam: pr?.goals_team ?? "", goalsFromCoaches: pr?.goals_from_coaches ?? "", photoUrl,
        }}
      />
    </>
  );
}

export default function PlayerDetailPage({ params, searchParams }: PageProps<"/coach/players/[id]">) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Suspense fallback={<p>Loading…</p>}>
        <Body params={params as Promise<{ id: string }>} searchParams={searchParams as Promise<{ saved?: string }>} />
      </Suspense>
    </main>
  );
}
