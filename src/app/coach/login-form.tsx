"use client";

import { useActionState } from "react";
import { staffLogin } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(staffLogin, {} as { error?: string });
  return (
    <form action={action} className="max-w-sm space-y-3">
      <input name="passcode" type="password" required placeholder="Staff passcode" className="input" />
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      <button disabled={pending} className="btn">Sign in</button>
    </form>
  );
}
