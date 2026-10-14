import { endSession, hasSession, sameSecret, startSession } from "./signed-session";

const COOKIE = "coach_session";

export const passcodeMatches = (input: string) =>
  !!process.env.SESSION_SECRET && sameSecret(input, process.env.COACH_PASSCODE);
export const startCoachSession = () => startSession(COOKIE);
export const endCoachSession = () => endSession(COOKIE);
export const isCoach = () => hasSession(COOKIE);
