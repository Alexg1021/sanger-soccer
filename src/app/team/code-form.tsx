"use client";

import { useActionState } from "react";
import { teamLogin } from "./actions";

export function CodeForm() {
  const [state, action, pending] = useActionState(teamLogin, {} as { error?: string });
  return (
    <form action={action} className="max-w-sm space-y-3">
      <input name="code" required placeholder="Team code" autoComplete="off" className="input" />
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      <button disabled={pending} className="btn">
        Enter
      </button>
    </form>
  );
}
