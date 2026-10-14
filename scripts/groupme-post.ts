// Usage: npx tsx scripts/groupme-post.ts "message" [--send]
// Without --send it only prints a preview. Nothing reaches the team chat until you add --send.
import { existsSync } from "node:fs";
import { GROUPME_MAX_CHARS, postToGroupMe } from "../src/lib/groupme";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const args = process.argv.slice(2);
const send = args.includes("--send");
const text = args.filter((a) => a !== "--send").join(" ").trim();

if (!text) {
  console.error('Usage: npx tsx scripts/groupme-post.ts "message" [--send]');
  process.exit(1);
}

console.log("----- preview -----");
console.log(text);
console.log(`----- ${text.length}/${GROUPME_MAX_CHARS} chars -----`);

if (!send) {
  console.log("Not sent. Re-run with --send to post to the team chat.");
  process.exit(0);
}

postToGroupMe(text)
  .then(() => console.log("Posted."))
  .catch((e: Error) => {
    console.error("Failed:", e.message);
    process.exit(1);
  });
