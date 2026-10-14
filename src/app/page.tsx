import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16">
      <h1 className="text-4xl font-bold">Sanger Varsity Boys Soccer</h1>
      <ul className="mt-8 space-y-3 text-lg">
        <li><Link className="underline" href="/schedule">Schedule</Link></li>
        <li><Link className="underline" href="/players">Meet the team</Link></li>
        <li><Link className="underline" href="/join">Player profile form</Link></li>
      </ul>
    </main>
  );
}
