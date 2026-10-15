import { z } from "zod";
import { POSITIONS, text } from "./profile-schema";

const blankToUndef = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const optInt = (min: number, max: number) => z.preprocess(blankToUndef, z.coerce.number().int().min(min).max(max).optional());

/** Coach-side schema: same fields as the player form, but nothing is required except a name. */
export const playerEditSchema = z.object({
  fullName: z.string().trim().min(2, "Enter a name").max(100),
  preferredName: text(50),
  grade: optInt(9, 12),
  jerseyNumber: optInt(0, 99),
  positions: z.array(z.enum(POSITIONS)).max(3, "Up to 3 positions"),
  email: z.preprocess(blankToUndef, z.string().trim().toLowerCase().email("Enter a valid email").optional()),
  phone: text(30),
  parentName: text(100),
  parentContact: text(120),
  socialHandle: text(60),
  photoPermission: z.boolean(),
  status: z.enum(["submitted", "approved", "hidden"]),
  bio: text(600),
  yearsPlaying: text(100),
  previousTeams: text(300),
  strengths: text(400),
  workingOn: text(400),
  whyIPlay: text(400),
  funFact: text(300),
  afterHsPlans: text(300),
  goalsIndividual: text(800),
  goalsTeam: text(800),
  goalsFromCoaches: text(600),
});
