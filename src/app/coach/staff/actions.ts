"use server";

import { revalidatePath } from "next/cache";
import { requireCoach } from "@/lib/auth";
import { db } from "@/lib/supabase";

const s = (fd: FormData, k: string, max: number) => {
  const v = String(fd.get(k) ?? "").trim().slice(0, max);
  return v || null;
};

function rowFrom(fd: FormData) {
  const full_name = s(fd, "full_name", 100);
  const role = s(fd, "role", 100);
  if (!full_name || !role) return null;
  return { full_name, role, owns: s(fd, "owns", 150), email: s(fd, "email", 150), phone: s(fd, "phone", 40) };
}

export async function saveStaff(formData: FormData) {
  await requireCoach();
  const row = rowFrom(formData);
  if (!row) return;
  const id = String(formData.get("id") ?? "");
  const { error } = id ? await db().from("staff").update(row).eq("id", id) : await db().from("staff").insert(row);
  if (error) throw error;
  revalidatePath("/coach/staff");
  revalidatePath("/staff");
}

export async function deleteStaff(formData: FormData) {
  await requireCoach();
  const { error } = await db().from("staff").delete().eq("id", String(formData.get("id")));
  if (error) throw error;
  revalidatePath("/coach/staff");
  revalidatePath("/staff");
}
