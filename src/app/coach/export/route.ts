import { connection } from "next/server";
import { isCoach } from "@/lib/coach-session";
import { db } from "@/lib/supabase";

// Spreadsheet apps run cells starting with = + - @ as formulas; player-typed text must not be able to.
const cell = (v: unknown) => {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET() {
  await connection();
  if (!(await isCoach())) return new Response("Unauthorized", { status: 401 });
  const { data, error } = await db()
    .from("players")
    .select("jersey_number, full_name, grade, positions, email, phone, parent_name, parent_contact, social_handle, status")
    .order("jersey_number");
  if (error) return new Response("Export failed", { status: 500 });
  const head = ["Jersey", "Name", "Grade", "Positions", "Email", "Phone", "Parent", "Parent contact", "Social", "Status"];
  const lines = [head.map(cell).join(",")].concat(
    (data ?? []).map((p) =>
      [p.jersey_number, p.full_name, p.grade, (p.positions ?? []).join("/"), p.email, p.phone, p.parent_name, p.parent_contact, p.social_handle, p.status].map(cell).join(","),
    ),
  );
  return new Response(lines.join("\r\n") + "\r\n", {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="sanger-roster.csv"', "Cache-Control": "no-store" },
  });
}
