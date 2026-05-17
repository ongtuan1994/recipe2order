import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1).max(60),
  nameEn: z.string().max(60).optional().or(z.literal("")),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().or(z.literal("")),
  icon: z.string().max(20).optional().or(z.literal("")),
});

export type CategoryInput = z.infer<typeof categorySchema>;
