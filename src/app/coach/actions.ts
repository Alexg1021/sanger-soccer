"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/supabase";
import { endCoachSession, isCoach, passcodeMatches, startCoachSession } from "@/lib/coach-session";
import { rateLimited } from "@/lib/ratelimit";
import { headers } from "next/headers";

export async function coachLogin(_prev: { error?: string }, formData: FormData) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(`coach:${ip}`, 10, 15 * 60 * 1000)) return { error: "Too many attempts. Wait a few minutes." };
  if (!passcodeMatches(String(formData.get("passcode") ?? ""))) return { error: "Wrong passcode." };
  await startCoachSession();
  redirect("/coach");
}

export async function coachLogout() {
  await endCoachSession();
  redirect("/coach");
}

export async function setStatus(formData: FormData) {
  if (!(await isCoach())) throw new Error("Unauthorized");
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (!["submitted", "approved", "hidden"].includes(status)) throw new Error("Bad status");
  const { error } = await db().from("players").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
  revalidatePath("/coach");
  revalidatePath("/players");
}

export async function deletePlayer(formData: FormData) {
  if (!(await isCoach())) throw new Error("Unauthorized");
  const id = String(formData.get("id"));
  const supabase = db();
  const { data } = await supabase.from("profiles").select("photo_path").eq("player_id", id).maybeSingle();
  if (data?.photo_path) await supabase.storage.from("player-photos").remove([data.photo_path]);
  const { error } = await supabase.from("players").delete().eq("id", id); // profile cascades
  if (error) throw error;
  revalidatePath("/coach");
  revalidatePath("/players");
}
