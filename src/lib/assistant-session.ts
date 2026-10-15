import { endSession, hasSession, sameSecret, startSession } from "./signed-session";

const COOKIE = "assistant_session";

export const assistantPasscodeMatches = (input: string) =>
  !!process.env.SESSION_SECRET && !!process.env.ASSISTANT_PASSCODE && sameSecret(input, process.env.ASSISTANT_PASSCODE);
export const startAssistantSession = () => startSession(COOKIE);
export const endAssistantSession = () => endSession(COOKIE);
export const isAssistant = () => hasSession(COOKIE);
