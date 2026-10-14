import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { publicPlayers } from "@/lib/players";

export const metadata: Metadata = { title: "Players | Sanger Boys Soccer" };

async function Roster() {
  await connection();
  const players = await publicPlayers();
  if (!players.length) return <p className="text-zinc-600">Profiles are coming soon.</p>;
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {players.map((p) => (
        <li key={p.id}>
          <Link href={`/players/${p.id}`} className="block rounded-lg border p-3 hover:bg-zinc-50">
            {p.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.photoUrl} alt={p.displayName} className="mb-2 aspect-square w-full rounded object-cover" />
            ) : (
              <div className="mb-2 aspect-square w-full rounded bg-zinc-100" />
            )}
            <div className="font-semibold">#{p.jersey} {p.displayName}</div>
            <div className="text-sm text-zinc-600">{p.positions.join(", ")}</div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function PlayersPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">Meet the Team</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <Roster />
      </Suspense>
    </main>
  );
}
