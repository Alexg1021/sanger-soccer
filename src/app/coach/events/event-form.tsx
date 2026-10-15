"use client";

import { useActionState } from "react";
import type { EventFormState } from "./actions";

export type EventDefaults = Partial<{
  title: string; type: string; date: string; startTime: string; endDate: string; endTime: string;
  location: string; notes: string; visibility: string;
}>;

export function EventForm({ action, defaults = {} }: { action: (p: EventFormState, f: FormData) => Promise<EventFormState>; defaults?: EventDefaults }) {
  const [state, formAction, pending] = useActionState(action, {} as EventFormState);
  const e = state.errors ?? {};
  const err = (k: string) => e[k]?.map((m) => <p key={m} className="text-sm text-red-700">{m}</p>);
  return (
    <form action={formAction} className="space-y-4">
      {state.message && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{state.message}</p>}
      <div>
        <label className="block text-sm font-medium" htmlFor="title">Title</label>
        <input id="title" name="title" required defaultValue={defaults.title} placeholder="vs. Clovis West" className="input" />
        {err("title")}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium" htmlFor="type">Type</label>
          <select id="type" name="type" defaultValue={defaults.type ?? "game"} className="input">
            {["game", "practice", "showcase", "meeting", "travel", "other"].map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="visibility">Who can see it</label>
          <select id="visibility" name="visibility" defaultValue={defaults.visibility ?? "public"} className="input">
            <option value="public">public (anyone)</option>
            <option value="team">team (players with the code)</option>
            <option value="staff">staff only</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="date">Date</label>
          <input id="date" name="date" type="date" required defaultValue={defaults.date} className="input" />
          {err("date")}
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="endDate">End date (multi-day, optional)</label>
          <input id="endDate" name="endDate" type="date" defaultValue={defaults.endDate} className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="startTime">Start time (blank = all day / TBD)</label>
          <input id="startTime" name="startTime" type="time" defaultValue={defaults.startTime} className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="endTime">End time (optional)</label>
          <input id="endTime" name="endTime" type="time" defaultValue={defaults.endTime} className="input" />
          {err("endTime")}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor="location">Location</label>
        <input id="location" name="location" defaultValue={defaults.location} className="input" />
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor="notes">Notes (team/staff views only: bus times, uniforms…)</label>
        <textarea id="notes" name="notes" rows={3} defaultValue={defaults.notes} className="input" />
      </div>
      <p className="text-xs text-stone-500">Times are Pacific. Notes never show on the public schedule.</p>
      <button disabled={pending} className="btn">{pending ? "Saving…" : "Save event"}</button>
    </form>
  );
}
