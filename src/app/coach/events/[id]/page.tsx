import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { CoachNav } from "@/components/coach-nav";
import { requireCoach } from "@/lib/auth";
import { dayKey, pacificParts } from "@/lib/events";
import { db } from "@/lib/supabase";
import { deleteEvent, saveEvent } from "../actions";
import { EventForm, type EventDefaults } from "../event-form";

export const metadata: Metadata = { title: "Event | Coach", robots: { index: false } };

async function Body({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  await requireCoach();
  const { id } = await params;

  let defaults: EventDefaults = {};
  if (id !== "new") {
    if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
    const { data: e, error } = await db().from("events").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!e) notFound();
    const s = pacificParts(e.starts_at);
    const end = e.ends_at ? pacificParts(e.ends_at) : null;
    defaults = {
      title: e.title, type: e.type, visibility: e.visibility, date: s.date,
      startTime: e.all_day ? "" : s.time,
      endDate: end && end.date !== dayKey(e.starts_at) ? end.date : "",
      endTime: end && !e.all_day ? end.time : "",
      location: e.location ?? "", notes: e.notes ?? "",
    };
  }

  return (
    <>
      <CoachNav />
      <Link href="/coach/events" className="text-sm underline">&larr; Events</Link>
      <div className="my-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{id === "new" ? "Add event" : "Edit event"}</h1>
        {id !== "new" && (
          <form action={deleteEvent}>
            <input type="hidden" name="id" value={id} />
            <button className="btn-outline btn-danger">Delete</button>
          </form>
        )}
      </div>
      <EventForm action={saveEvent.bind(null, id === "new" ? null : id)} defaults={defaults} />
    </>
  );
}

export default function EventPage({ params }: PageProps<"/coach/events/[id]">) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <Suspense fallback={<p>Loading…</p>}>
        <Body params={params as Promise<{ id: string }>} />
      </Suspense>
    </main>
  );
}
