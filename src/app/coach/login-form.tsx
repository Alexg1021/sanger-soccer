"use client";

import { useActionState } from "react";
import { coachLogin } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(coachLogin, {} as { error?: string });
  return (
    <form action={action} className="space-y-3">
      <input
        name="passcode"
        type="password"
        required
        placeholder="Coach passcode"
        className="w-full rounded-md border border-zinc-300 px-3 py-2"
      />
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      <button disabled={pending} className="rounded-md bg-red-700 px-4 py-2 font-semibold text-white disabled:opacity-60">
        Sign in
      </button>
    </form>
  );
}
