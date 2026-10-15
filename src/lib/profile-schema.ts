import { z } from "zod";

export const POSITIONS = ["GK", "CB", "FB", "CDM", "CM", "CAM", "Winger", "ST"] as const;

export const text = (max: number) => z.string().trim().max(max).optional().transform((v) => v || undefined);

export const profileSchema = z.object({
  teamCode: z.string().trim().min(1, "Enter the team code"),
  fullName: z.string().trim().min(2, "Enter your full name").max(100),
  preferredName: text(50),
  grade: z.coerce.number().int().min(9).max(12),
  jerseyNumber: z.coerce.number().int().min(0).max(99),
  positions: z.array(z.enum(POSITIONS)).min(1, "Pick at least one position").max(3),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: text(30),
  parentName: text(100),
  parentContact: text(120),
  socialHandle: text(60),
  photoPermission: z.boolean(),

  bio: text(600),
  yearsPlaying: text(100),
  previousTeams: text(300),
  strengths: text(400),
  workingOn: text(400),
  whyIPlay: text(400),
  funFact: text(300),
  afterHsPlans: text(300),
  goalsIndividual: z.string().trim().min(3, "Tell us at least one personal goal").max(800),
  goalsTeam: z.string().trim().min(3, "Tell us at least one team goal").max(800),
  goalsFromCoaches: text(600),
});

export type ProfileInput = z.infer<typeof profileSchema>;
