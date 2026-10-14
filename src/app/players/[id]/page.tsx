import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { publicPlayer } from "@/lib/players";

async function Profile({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const p = await publicPlayer(id);
  if (!p) notFound();

  const sections: [string, string | null][] = [
    ["About", p.bio],
    ["Strengths", p.strengths],
    ["Why I play", p.whyIPlay],
    ["Fun fact", p.funFact],
    ["My goals this season", p.goalsIndividual],
    ["Team goals", p.goalsTeam],
  ];

  return (
    <article>
      <div className="mb-6 flex items-center gap-5">
        {p.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.photoUrl} alt={p.displayName} className="h-32 w-32 rounded-lg object-cover" />
        )}
        <div>
          <h1 className="text-3xl font-bold">{p.displayName}</h1>
          <p className="text-zinc-600">
            #{p.jersey} · {p.positions.join(", ")}{p.grade && ` · Grade ${p.grade}`}
          </p>
        </div>
      </div>
      {sections.map(([title, body]) =>
        body ? (
          <section key={title} className="mb-4">
            <h2 className="font-semibold">{title}</h2>
            <p className="whitespace-pre-line text-zinc-700">{body}</p>
          </section>
        ) : null,
      )}
    </article>
  );
}

export default function PlayerPage({ params }: PageProps<"/players/[id]">) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <Link href="/players" className="mb-4 inline-block text-sm underline">&larr; All players</Link>
      <Suspense fallback={<p>Loading…</p>}>
        <Profile params={params as Promise<{ id: string }>} />
      </Suspense>
    </main>
  );
}
