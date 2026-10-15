"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireCoach } from "@/lib/auth";
import { playerEditSchema } from "@/lib/player-edit-schema";
import { db } from "@/lib/supabase";

export type PlayerFormState = { ok: boolean; message?: string; errors?: Record<string, string[] | undefined> };

const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
const PHOTO_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Shared by create and update. `playerId` is null for a new player. */
export async function savePlayer(playerId: string | null, _prev: PlayerFormState, formData: FormData): Promise<PlayerFormState> {
  await requireCoach();

  const parsed = playerEditSchema.safeParse({
    ...Object.fromEntries(formData),
    positions: formData.getAll("positions"),
    photoPermission: formData.get("photoPermission") === "yes",
  });
  if (!parsed.success) {
    return { ok: false, errors: z.flattenError(parsed.error).fieldErrors, message: "Check the highlighted fields." };
  }
  const d = parsed.data;

  const photo = formData.get("photo");
  let photoFile: File | null = null;
  if (photo instanceof File && photo.size > 0) {
    if (!PHOTO_TYPES[photo.type]) return { ok: false, errors: { photo: ["Use a JPG, PNG, or WebP image."] } };
    if (photo.size > MAX_PHOTO_BYTES) return { ok: false, errors: { photo: ["Photo must be under 4 MB."] } };
    photoFile = photo;
  }

  const supabase = db();
  const playerRow = {
    full_name: d.fullName,
    preferred_name: d.preferredName ?? null,
    grade: d.grade ?? null,
    jersey_number: d.jerseyNumber ?? null,
    positions: d.positions,
    email: d.email ?? null,
    phone: d.phone ?? null,
    parent_name: d.parentName ?? null,
    parent_contact: d.parentContact ?? null,
    social_handle: d.socialHandle ?? null,
    photo_permission: d.photoPermission,
    status: d.status,
    updated_at: new Date().toISOString(),
  };

  let id = playerId;
  if (id) {
    const { error } = await supabase.from("players").update(playerRow).eq("id", id);
    if (error) return dbError(error);
  } else {
    const { data, error } = await supabase.from("players").insert(playerRow).select("id").single();
    if (error) return dbError(error);
    id = data.id;
  }

  let photoPath: string | undefined;
  if (photoFile) {
    photoPath = `${id}.${PHOTO_TYPES[photoFile.type]}`;
    const { data: old } = await supabase.from("profiles").select("photo_path").eq("player_id", id!).maybeSingle();
    const { error: upErr } = await supabase.storage.from("player-photos").upload(photoPath, photoFile, { contentType: photoFile.type, upsert: true });
    if (upErr) {
      console.error("photo upload failed", upErr);
      return { ok: false, errors: { photo: ["Photo upload failed. The rest was saved; try the photo again."] } };
    }
    if (old?.photo_path && old.photo_path !== photoPath) await supabase.storage.from("player-photos").remove([old.photo_path]);
  }

  const { error: profErr } = await supabase.from("profiles").upsert({
    player_id: id,
    updated_at: new Date().toISOString(),
    bio: d.bio ?? null,
    years_playing: d.yearsPlaying ?? null,
    previous_teams: d.previousTeams ?? null,
    strengths: d.strengths ?? null,
    working_on: d.workingOn ?? null,
    why_i_play: d.whyIPlay ?? null,
    fun_fact: d.funFact ?? null,
    after_hs_plans: d.afterHsPlans ?? null,
    goals_individual: d.goalsIndividual ?? null,
    goals_team: d.goalsTeam ?? null,
    goals_from_coaches: d.goalsFromCoaches ?? null,
    ...(photoPath ? { photo_path: photoPath } : {}),
  });
  if (profErr) {
    console.error("profile save failed", profErr);
    return { ok: false, message: "Saved the player but not the profile. Try again." };
  }

  revalidatePath("/coach", "layout");
  revalidatePath("/players");
  revalidatePath(`/players/${id}`);
  redirect(`/coach/players/${id}?saved=1`);
}

function dbError(error: { code?: string; message: string }): PlayerFormState {
  if (error.code === "23505") return { ok: false, errors: { email: ["Another player already has this email."] } };
  console.error("save player failed", error);
  return { ok: false, message: "Something went wrong saving. Try again." };
}
