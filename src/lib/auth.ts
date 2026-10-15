import { redirect } from "next/navigation";
import { isAssistant } from "./assistant-session";
import { isCoach } from "./coach-session";

export type Role = "coach" | "assistant" | null;

export async function getRole(): Promise<Role> {
  if (await isCoach()) return "coach";
  if (await isAssistant()) return "assistant";
  return null;
}

/** Use at the top of coach-only pages AND inside every coach-only server action. */
export async function requireCoach() {
  if (!(await isCoach())) redirect("/coach");
}

/** Coach or assistant. Returns the role. */
export async function requireStaff(): Promise<Exclude<Role, null>> {
  const role = await getRole();
  if (!role) redirect("/coach");
  return role;
}

/** PostgREST/Postgres codes for "relation/table not found": migration hasn't been run yet. */
export const isMissingTable = (e: { code?: string } | null) => e?.code === "42P01" || e?.code === "PGRST205";
