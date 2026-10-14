import type { Metadata } from "next";
import { JoinForm } from "./join-form";

export const metadata: Metadata = { title: "Player profile | Sanger Boys Soccer" };

export default function JoinPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold">Sanger Varsity Boys Soccer</h1>
      <p className="mt-2 mb-8 text-zinc-600">
        Fill this out once. It builds your player profile and tells us your goals for the season.
      </p>
      <JoinForm />
    </main>
  );
}
