"use client";

import { useActionState } from "react";
import { teamLogin } from "./actions";

export function CodeForm() {
  const [state, action, pending] = useActionState(teamLogin, {} as { error?: string });
  return (
    <form action={action} className="max-w-sm space-y-3">
      <input name="code" required placeholder="Team code" autoComplete="off" className="w-full rounded-md border border-zinc-300 px-3 py-2" />
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      <button disabled={pending} className="rounded-md bg-red-700 px-4 py-2 font-semibold text-white disabled:opacity-60">
        Enter
      </button>
    </form>
  );
}
