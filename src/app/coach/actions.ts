"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { assistantPasscodeMatches, endAssistantSession, startAssistantSession } from "@/lib/assistant-session";
import { requireCoach } from "@/lib/auth";
import { endCoachSession, passcodeMatches, startCoachSession } from "@/lib/coach-session";
import { rateLimited } from "@/lib/ratelimit";
import { db } from "@/lib/supabase";

export async function staffLogin(_prev: { error?: string }, formData: FormData) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(`coach:${ip}`, 10, 15 * 60 * 1000)) return { error: "Too many attempts. Wait a few minutes." };
  const code = String(formData.get("passcode") ?? "");
  if (passcodeMatches(code)) {
    await startCoachSession();
    redirect("/coach");
  }
  if (assistantPasscodeMatches(code)) {
    await startAssistantSession();
    redirect("/staff");
  }
  return { error: "Wrong passcode." };
}

export async function staffLogout() {
  await endCoachSession();
  await endAssistantSession();
  redirect("/coach");
}

export async function setStatus(formData: FormData) {
  await requireCoach();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (!["submitted", "approved", "hidden"].includes(status)) throw new Error("Bad status");
  const { error } = await db().from("players").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
  revalidatePath("/coach", "layout");
  revalidatePath("/players");
}

export async function deletePlayer(formData: FormData) {
  await requireCoach();
  const id = String(formData.get("id"));
  const supabase = db();
  const { data } = await supabase.from("profiles").select("photo_path").eq("player_id", id).maybeSingle();
  if (data?.photo_path) await supabase.storage.from("player-photos").remove([data.photo_path]);
  const { error } = await supabase.from("players").delete().eq("id", id); // profile cascades
  if (error) throw error;
  revalidatePath("/coach", "layout");
  revalidatePath("/players");
  redirect("/coach");
}

function names(raw: string): string[] {
  return raw.split(/[\n,;]+/).map((n) => n.trim().replace(/\s+/g, " ")).filter((n) => n.length > 1 && n.length <= 100);
}

export async function addExpected(formData: FormData) {
  await requireCoach();
  const supabase = db();
  const incoming = names(String(formData.get("names") ?? ""));
  const { data: existing } = await supabase.from("expected_players").select("full_name");
  const have = new Set((existing ?? []).map((e) => e.full_name.toLowerCase()));
  const fresh = [...new Map(incoming.map((n) => [n.toLowerCase(), n])).values()].filter((n) => !have.has(n.toLowerCase()));
  if (fresh.length) {
    const { error } = await supabase.from("expected_players").insert(fresh.map((full_name) => ({ full_name })));
    if (error) throw error;
  }
  revalidatePath("/coach", "layout");
}

export async function removeExpected(formData: FormData) {
  await requireCoach();
  const { error } = await db().from("expected_players").delete().eq("id", String(formData.get("id")));
  if (error) throw error;
  revalidatePath("/coach", "layout");
}
