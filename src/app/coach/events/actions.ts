"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireCoach } from "@/lib/auth";
import { pacificToDate } from "@/lib/schedule-csv";
import { db } from "@/lib/supabase";

export type EventFormState = { message?: string; errors?: Record<string, string[] | undefined> };

const blank = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date");
const time = z.preprocess(blank, z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM").optional());

const schema = z.object({
  title: z.string().trim().min(1, "Enter a title").max(150),
  type: z.enum(["game", "practice", "showcase", "meeting", "travel", "other"]),
  date,
  startTime: time,
  endDate: z.preprocess(blank, date.optional()),
  endTime: time,
  location: z.preprocess(blank, z.string().trim().max(150).optional()),
  notes: z.preprocess(blank, z.string().trim().max(1000).optional()),
  visibility: z.enum(["public", "team", "staff"]),
});

const at = (d: string, t?: string) => {
  const [y, m, day] = d.split("-").map(Number);
  const [h, mi] = (t ?? "00:00").split(":").map(Number);
  return pacificToDate(y, m, day, h, mi);
};

export async function saveEvent(eventId: string | null, _prev: EventFormState, formData: FormData): Promise<EventFormState> {
  await requireCoach();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, message: "Check the highlighted fields." };
  const d = parsed.data;

  const starts = at(d.date, d.startTime);
  let ends: Date | null = null;
  if (d.endDate) ends = at(d.endDate, d.endTime);
  else if (d.startTime && d.endTime) ends = at(d.date, d.endTime);
  if (ends && ends <= starts) return { errors: { endTime: ["End must be after the start."] } };

  const row = {
    title: d.title,
    type: d.type,
    starts_at: starts.toISOString(),
    ends_at: ends?.toISOString() ?? null,
    all_day: !d.startTime,
    location: d.location ?? null,
    notes: d.notes ?? null,
    visibility: d.visibility,
    manually_edited: true, // the CSV importer leaves hand-edited events alone
  };

  const supabase = db();
  const { error } = eventId
    ? await supabase.from("events").update(row).eq("id", eventId)
    : await supabase.from("events").insert(row);
  if (error) {
    console.error("save event failed", error);
    return { message: error.code === "42703" ? "Run migration 0002 in Supabase first." : "Couldn't save. Try again." };
  }
  revalidatePath("/schedule");
  revalidatePath("/team");
  revalidatePath("/coach/events");
  redirect("/coach/events");
}

export async function deleteEvent(formData: FormData) {
  await requireCoach();
  const { error } = await db().from("events").delete().eq("id", String(formData.get("id")));
  if (error) throw error;
  revalidatePath("/schedule");
  revalidatePath("/team");
  revalidatePath("/coach/events");
  redirect("/coach/events");
}
