"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { rateLimited } from "@/lib/ratelimit";
import { endTeamSession, startTeamSession, teamCodeMatches } from "@/lib/team-session";

export async function teamLogin(_prev: { error?: string }, formData: FormData) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(`team:${ip}`, 10, 15 * 60 * 1000)) return { error: "Too many attempts. Try again in a few minutes." };
  if (!teamCodeMatches(String(formData.get("code") ?? ""))) return { error: "That code isn't right." };
  await startTeamSession();
  redirect("/team");
}

export async function teamLogout() {
  await endTeamSession();
  redirect("/team");
}
