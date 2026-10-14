const POST_URL = "https://api.groupme.com/v3/bots/post";
export const GROUPME_MAX_CHARS = 1000;

/** Posts to the group the bot belongs to. Throws on failure. Callers must have the coach's approval first. */
export async function postToGroupMe(text: string, botId = process.env.GROUPME_BOT_ID): Promise<void> {
  if (!botId) throw new Error("GROUPME_BOT_ID is not set");
  if (!text.trim()) throw new Error("Message is empty");
  if (text.length > GROUPME_MAX_CHARS) throw new Error(`Message is ${text.length} chars; GroupMe's limit is ${GROUPME_MAX_CHARS}`);
  const res = await fetch(POST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bot_id: botId, text }),
  });
  if (!res.ok) throw new Error(`GroupMe returned ${res.status}: ${await res.text()}`);
}
