"use client";

import { useActionState } from "react";
import { PhotoInput } from "@/components/photo-input";
import { POSITIONS } from "@/lib/profile-schema";
import type { PlayerFormState } from "./actions";

export type PlayerDefaults = Partial<{
  fullName: string; preferredName: string; grade: number; jerseyNumber: number; positions: string[];
  email: string; phone: string; parentName: string; parentContact: string; socialHandle: string;
  photoPermission: boolean; status: string; bio: string; yearsPlaying: string; previousTeams: string;
  strengths: string; workingOn: string; whyIPlay: string; funFact: string; afterHsPlans: string;
  goalsIndividual: string; goalsTeam: string; goalsFromCoaches: string; photoUrl: string | null;
}>;

function F({ label, name, err, children }: { label: string; name: string; err?: string[]; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium">{label}</label>
      {children}
      {err?.map((e) => <p key={e} className="text-sm text-red-700">{e}</p>)}
    </div>
  );
}

export function PlayerForm({
  action,
  defaults = {},
}: {
  action: (prev: PlayerFormState, fd: FormData) => Promise<PlayerFormState>;
  defaults?: PlayerDefaults;
}) {
  const [state, formAction, pending] = useActionState(action, { ok: false } as PlayerFormState);
  const e = state.errors ?? {};
  const d = defaults;
  const text = (name: string, label: string, value?: string | number, type = "text") => (
    <F label={label} name={name} err={e[name]}>
      <input id={name} name={name} type={type} defaultValue={value ?? ""} className="input" />
    </F>
  );
  const area = (name: string, label: string, value?: string, rows = 2) => (
    <F label={label} name={name} err={e[name]}>
      <textarea id={name} name={name} rows={rows} defaultValue={value ?? ""} className="input" />
    </F>
  );

  return (
    <form action={formAction} className="space-y-8">
      {state.message && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{state.message}</p>}

      <section className="grid gap-4 sm:grid-cols-2">
        {text("fullName", "Full name", d.fullName)}
        {text("preferredName", "Preferred name", d.preferredName)}
        {text("grade", "Grade", d.grade, "number")}
        {text("jerseyNumber", "Jersey #", d.jerseyNumber, "number")}
        {text("email", "Email", d.email, "email")}
        {text("phone", "Phone", d.phone, "tel")}
        {text("parentName", "Parent/guardian", d.parentName)}
        {text("parentContact", "Parent phone or email", d.parentContact)}
        {text("socialHandle", "Social handle", d.socialHandle)}
        <F label="Status" name="status" err={e.status}>
          <select id="status" name="status" defaultValue={d.status ?? "approved"} className="input">
            <option value="submitted">submitted (not public)</option>
            <option value="approved">approved (public if photo permission)</option>
            <option value="hidden">hidden</option>
          </select>
        </F>
      </section>

      <fieldset>
        <legend className="text-sm font-medium">Positions (up to 3)</legend>
        <div className="mt-2 flex flex-wrap gap-3">
          {POSITIONS.map((p) => (
            <label key={p} className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" name="positions" value={p} defaultChecked={d.positions?.includes(p)} /> {p}
            </label>
          ))}
        </div>
        {e.positions?.map((m) => <p key={m} className="text-sm text-red-700">{m}</p>)}
      </fieldset>

      <section className="space-y-4">
        <h2 className="font-semibold">Profile</h2>
        <F label="Photo" name="photo" err={e.photo}>
          {d.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={d.photoUrl} alt="" className="mb-2 h-28 w-28 rounded object-cover" />
          )}
          <PhotoInput />
        </F>
        {area("bio", "Bio", d.bio, 3)}
        <div className="grid gap-4 sm:grid-cols-2">
          {text("yearsPlaying", "Years playing", d.yearsPlaying)}
          {text("previousTeams", "Previous teams/clubs", d.previousTeams)}
        </div>
        {area("strengths", "Strengths", d.strengths)}
        {area("workingOn", "Working on", d.workingOn)}
        {area("whyIPlay", "Why I play", d.whyIPlay)}
        {text("funFact", "Fun fact", d.funFact)}
        {text("afterHsPlans", "After high school", d.afterHsPlans)}
        {area("goalsIndividual", "Personal goals", d.goalsIndividual, 3)}
        {area("goalsTeam", "Team goals", d.goalsTeam, 3)}
        {area("goalsFromCoaches", "Wants from coaches", d.goalsFromCoaches)}
      </section>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="photoPermission" value="yes" defaultChecked={d.photoPermission} className="mt-1" />
        Permission to use name, photo, and profile on team social media and the website
      </label>

      <button disabled={pending} className="btn">{pending ? "Saving…" : "Save"}</button>
    </form>
  );
}
