import { endSession, hasSession, sameSecret, startSession } from "./signed-session";

const COOKIE = "team_session";

export const teamCodeMatches = (input: string) =>
  !!process.env.SESSION_SECRET && sameSecret(input.trim().toLowerCase(), process.env.TEAM_CODE?.toLowerCase());
export const startTeamSession = () => startSession(COOKIE, 30 * 24 * 3600 * 1000);
export const endTeamSession = () => endSession(COOKIE);
export const isTeamMember = () => hasSession(COOKIE);
