import { db } from "./supabase";

export type PublicPlayer = {
  id: string;
  displayName: string;
  grade: number | null;
  jersey: number | null;
  positions: string[];
  bio: string | null;
  strengths: string | null;
  whyIPlay: string | null;
  funFact: string | null;
  goalsIndividual: string | null;
  goalsTeam: string | null;
  photoUrl: string | null;
};

const COLS =
  "id, full_name, preferred_name, grade, jersey_number, positions, profiles(bio, strengths, why_i_play, fun_fact, goals_individual, goals_team, photo_path)";

/** First name (or preferred) + last initial only. No contact info ever leaves this module. */
function displayName(full: string, preferred: string | null) {
  const parts = full.trim().split(/\s+/);
  const first = preferred || parts[0];
  const last = parts.length > 1 ? ` ${parts[parts.length - 1][0]}.` : "";
  return `${first}${last}`;
}

type Prof = {
  bio: string | null; strengths: string | null; why_i_play: string | null; fun_fact: string | null;
  goals_individual: string | null; goals_team: string | null; photo_path: string | null;
};
type Row = {
  id: string; full_name: string; preferred_name: string | null; grade: number | null;
  jersey_number: number | null; positions: string[] | null; profiles: Prof | Prof[] | null;
};

async function shape(row: Row): Promise<PublicPlayer> {
  const prof = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  let photoUrl: string | null = null;
  if (prof?.photo_path) {
    const { data } = await db().storage.from("player-photos").createSignedUrl(prof.photo_path, 3600);
    photoUrl = data?.signedUrl ?? null;
  }
  return {
    id: row.id,
    displayName: displayName(row.full_name, row.preferred_name),
    grade: row.grade,
    jersey: row.jersey_number,
    positions: row.positions ?? [],
    bio: prof?.bio ?? null,
    strengths: prof?.strengths ?? null,
    whyIPlay: prof?.why_i_play ?? null,
    funFact: prof?.fun_fact ?? null,
    goalsIndividual: prof?.goals_individual ?? null,
    goalsTeam: prof?.goals_team ?? null,
    photoUrl,
  };
}

export async function publicPlayers(): Promise<PublicPlayer[]> {
  const { data, error } = await db()
    .from("players")
    .select(COLS)
    .eq("status", "approved")
    .eq("photo_permission", true)
    .order("jersey_number");
  if (error) throw error;
  return Promise.all(((data ?? []) as unknown as Row[]).map(shape));
}

export async function publicPlayer(id: string): Promise<PublicPlayer | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await db()
    .from("players")
    .select(COLS)
    .eq("id", id)
    .eq("status", "approved")
    .eq("photo_permission", true)
    .maybeSingle();
  if (error) throw error;
  return data ? shape(data as unknown as Row) : null;
}
