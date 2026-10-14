"use client";

import { useActionState } from "react";
import { submitProfile, type JoinState } from "./actions";
import { POSITIONS } from "@/lib/profile-schema";
import { resizeImage } from "@/lib/resize-image";

const initial: JoinState = { ok: false };

const input =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-red-700 focus:outline-none focus:ring-1 focus:ring-red-700";

function Field({
  label,
  name,
  error,
  hint,
  children,
}: {
  label: string;
  name: string;
  error?: string[];
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium text-zinc-800">
        {label}
      </label>
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
      {children}
      {error?.map((e) => (
        <p key={e} className="text-sm text-red-700">
          {e}
        </p>
      ))}
    </div>
  );
}

export function JoinForm() {
  const [state, action, pending] = useActionState(submitProfile, initial);
  const e = state.errors ?? {};

  if (state.ok) {
    return (
      <div className="rounded-lg border border-green-300 bg-green-50 p-6 text-green-900">
        <h2 className="text-xl font-semibold">You&apos;re in. Thanks!</h2>
        <p className="mt-2">Coach will review your profile. Keep an eye on the team chat for next steps.</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-10">
      {state.message && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          {state.message}
        </p>
      )}

      {/* Honeypot: hidden from people, tempting to bots. */}
      <div aria-hidden className="absolute -left-[9999px]">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Team code</h2>
        <Field label="Code from the team chat" name="teamCode" error={e.teamCode}>
          <input id="teamCode" name="teamCode" required className={input} autoComplete="off" />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">About you</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" name="fullName" error={e.fullName}>
            <input id="fullName" name="fullName" required className={input} autoComplete="name" />
          </Field>
          <Field label="Preferred name (optional)" name="preferredName" error={e.preferredName}>
            <input id="preferredName" name="preferredName" className={input} />
          </Field>
          <Field label="Grade" name="grade" error={e.grade}>
            <select id="grade" name="grade" required className={input} defaultValue="">
              <option value="" disabled>
                Select
              </option>
              {[9, 10, 11, 12].map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </Field>
          <Field label="Jersey number" name="jerseyNumber" error={e.jerseyNumber}>
            <input id="jerseyNumber" name="jerseyNumber" type="number" min={0} max={99} required className={input} />
          </Field>
        </div>
        <fieldset>
          <legend className="text-sm font-medium text-zinc-800">Position(s), up to 3</legend>
          <div className="mt-2 flex flex-wrap gap-3">
            {POSITIONS.map((p) => (
              <label key={p} className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" name="positions" value={p} /> {p}
              </label>
            ))}
          </div>
          {e.positions?.map((m) => (
            <p key={m} className="text-sm text-red-700">
              {m}
            </p>
          ))}
        </fieldset>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Contact</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your email" name="email" error={e.email}>
            <input id="email" name="email" type="email" required className={input} autoComplete="email" />
          </Field>
          <Field label="Your phone (optional)" name="phone" error={e.phone}>
            <input id="phone" name="phone" type="tel" className={input} autoComplete="tel" />
          </Field>
          <Field label="Parent/guardian name" name="parentName" error={e.parentName}>
            <input id="parentName" name="parentName" className={input} />
          </Field>
          <Field label="Parent/guardian phone or email" name="parentContact" error={e.parentContact}>
            <input id="parentContact" name="parentContact" className={input} />
          </Field>
          <Field label="Instagram / social handle (optional)" name="socialHandle" error={e.socialHandle}>
            <input id="socialHandle" name="socialHandle" className={input} />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Your profile</h2>
        <Field label="Photo (optional)" name="photo" error={e.photo} hint="Clear, action or portrait shot. Big photos are shrunk automatically.">
          <input
            id="photo"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="text-sm"
            onChange={async (ev) => {
              const input = ev.currentTarget;
              const file = input.files?.[0];
              if (!file) return;
              const small = await resizeImage(file);
              if (small !== file) {
                const dt = new DataTransfer();
                dt.items.add(small);
                input.files = dt.files;
              }
            }}
          />
        </Field>
        <Field label="Short bio" name="bio" error={e.bio}>
          <textarea id="bio" name="bio" rows={3} className={input} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Years playing" name="yearsPlaying" error={e.yearsPlaying}>
            <input id="yearsPlaying" name="yearsPlaying" className={input} />
          </Field>
          <Field label="Previous teams or clubs" name="previousTeams" error={e.previousTeams}>
            <input id="previousTeams" name="previousTeams" className={input} />
          </Field>
        </div>
        <Field label="Your strengths" name="strengths" error={e.strengths}>
          <textarea id="strengths" name="strengths" rows={2} className={input} />
        </Field>
        <Field label="What you're working on" name="workingOn" error={e.workingOn}>
          <textarea id="workingOn" name="workingOn" rows={2} className={input} />
        </Field>
        <Field label="Why do you play?" name="whyIPlay" error={e.whyIPlay}>
          <textarea id="whyIPlay" name="whyIPlay" rows={2} className={input} />
        </Field>
        <Field label="Fun fact" name="funFact" error={e.funFact}>
          <input id="funFact" name="funFact" className={input} />
        </Field>
        <Field label="Plans after high school" name="afterHsPlans" error={e.afterHsPlans}>
          <input id="afterHsPlans" name="afterHsPlans" className={input} />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Goals and intentions</h2>
        <Field label="Your personal goals this season" name="goalsIndividual" error={e.goalsIndividual}>
          <textarea id="goalsIndividual" name="goalsIndividual" rows={3} required className={input} />
        </Field>
        <Field label="Your goals for the team" name="goalsTeam" error={e.goalsTeam}>
          <textarea id="goalsTeam" name="goalsTeam" rows={3} required className={input} />
        </Field>
        <Field label="What do you want from the coaches?" name="goalsFromCoaches" error={e.goalsFromCoaches}>
          <textarea id="goalsFromCoaches" name="goalsFromCoaches" rows={2} className={input} />
        </Field>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Social media</h2>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="photoPermission" value="yes" className="mt-1" />
          <span>
            The program may use my name, photo, and profile on team social media and the team website.
            (Parent/guardian approval applies for players under 18.)
          </span>
        </label>
      </section>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-red-700 px-4 py-3 font-semibold text-white hover:bg-red-800 disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Submit my profile"}
      </button>
    </form>
  );
}
