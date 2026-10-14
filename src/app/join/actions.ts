"use server";

import { timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/supabase";
import { profileSchema } from "@/lib/profile-schema";
import { rateLimited } from "@/lib/ratelimit";

export type JoinState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

const MAX_PHOTO_BYTES = 4 * 1024 * 1024; // Vercel caps request bodies at 4.5 MB
const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function sameCode(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function submitProfile(_prev: JoinState, formData: FormData): Promise<JoinState> {
  // Honeypot: real users never see or fill this field.
  if (formData.get("website")) return { ok: true };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(`join:${ip}`)) {
    return { ok: false, message: "Too many attempts. Try again in a bit." };
  }

  const expected = process.env.TEAM_CODE;
  if (!expected) return { ok: false, message: "The form isn't configured yet. Tell Coach." };

  const parsed = profileSchema.safeParse({
    ...Object.fromEntries(formData),
    positions: formData.getAll("positions"),
    photoPermission: formData.get("photoPermission") === "yes",
  });
  if (!parsed.success) {
    return { ok: false, errors: z.flattenError(parsed.error).fieldErrors, message: "Check the highlighted fields." };
  }
  const d = parsed.data;

  if (!sameCode(d.teamCode.toLowerCase(), expected.toLowerCase())) {
    return { ok: false, errors: { teamCode: ["That code isn't right."] } };
  }

  // Photo is optional, validated by declared type and size (the bucket enforces both again).
  const photo = formData.get("photo");
  let photoFile: File | null = null;
  if (photo instanceof File && photo.size > 0) {
    if (!PHOTO_TYPES[photo.type]) return { ok: false, errors: { photo: ["Use a JPG, PNG, or WebP image."] } };
    if (photo.size > MAX_PHOTO_BYTES) return { ok: false, errors: { photo: ["Photo must be under 4 MB."] } };
    photoFile = photo;
  }

  const supabase = db();

  const { data: player, error: playerErr } = await supabase
    .from("players")
    .insert({
      full_name: d.fullName,
      preferred_name: d.preferredName,
      grade: d.grade,
      jersey_number: d.jerseyNumber,
      positions: d.positions,
      email: d.email,
      phone: d.phone,
      parent_name: d.parentName,
      parent_contact: d.parentContact,
      social_handle: d.socialHandle,
      photo_permission: d.photoPermission,
    })
    .select("id")
    .single();

  if (playerErr) {
    if (playerErr.code === "23505") {
      return { ok: false, errors: { email: ["That email has already submitted. Ask Coach if you need changes."] } };
    }
    console.error("insert player failed", playerErr);
    return { ok: false, message: "Something went wrong saving your info. Try again." };
  }

  let photoPath: string | undefined;
  if (photoFile) {
    photoPath = `${player.id}.${PHOTO_TYPES[photoFile.type]}`;
    const { error: upErr } = await supabase.storage
      .from("player-photos")
      .upload(photoPath, photoFile, { contentType: photoFile.type, upsert: true });
    if (upErr) {
      console.error("photo upload failed", upErr);
      photoPath = undefined; // keep the rest of the submission; coach can ask for the photo again
    }
  }

  const { error: profErr } = await supabase.from("profiles").insert({
    player_id: player.id,
    bio: d.bio,
    years_playing: d.yearsPlaying,
    previous_teams: d.previousTeams,
    strengths: d.strengths,
    working_on: d.workingOn,
    why_i_play: d.whyIPlay,
    fun_fact: d.funFact,
    after_hs_plans: d.afterHsPlans,
    goals_individual: d.goalsIndividual,
    goals_team: d.goalsTeam,
    goals_from_coaches: d.goalsFromCoaches,
    photo_path: photoPath,
  });
  if (profErr) {
    console.error("insert profile failed", profErr);
    await supabase.from("players").delete().eq("id", player.id); // don't leave a half-saved player
    return { ok: false, message: "Something went wrong saving your info. Try again." };
  }

  return { ok: true };
}
