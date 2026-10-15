import Image from "next/image";
import Link from "next/link";

const CARDS = [
  { href: "/schedule", title: "Schedule", body: "Games, showcases, and playoff dates. Add it to your phone calendar." },
  { href: "/players", title: "Meet the team", body: "Player profiles for the varsity squad." },
  { href: "/team", title: "Team page", body: "Bus times, notes, and team-only details. Team code required." },
  { href: "/join", title: "Player profile form", body: "Players: fill this out once to build your profile and set your goals." },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <section className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
        <Image src="/logo.png" alt="Sanger Apaches shield" width={160} height={160} className="h-40 w-auto" priority />
        <div>
          <h1 className="text-4xl font-bold text-brand">Sanger Varsity Boys Soccer</h1>
          <p className="mt-2 text-lg text-stone-600">Go Apaches. Everything for the 2026–27 season in one place.</p>
        </div>
      </section>
      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href} className="card p-5 transition hover:border-brand hover:bg-brand-tint">
            <h2 className="text-lg font-semibold text-brand">{c.title}</h2>
            <p className="mt-1 text-sm text-stone-600">{c.body}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
