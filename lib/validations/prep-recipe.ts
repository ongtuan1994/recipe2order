import { z } from "zod";

const ingredientLine = z.object({
  ingredientId: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unit: z.string().min(1).max(20),
  note: z.string().max(200).optional().or(z.literal("")),
  isOptional: z.boolean().default(false),
});

const stepLine = z
  .object({
    title: z.string().max(120).optional().or(z.literal("")),
    detail: z.string().max(2000).optional().or(z.literal("")),
  })
  .refine((s) => (s.title?.trim()?.length ?? 0) > 0 || (s.detail?.trim()?.length ?? 0) > 0, {
    message: "Step needs a title or detail",
    path: ["title"],
  });

export const prepRecipeSchema = z.object({
  name: z.string().min(1).max(120),
  nameEn: z.string().max(120).optional().or(z.literal("")),
  outputIngredientId: z.string().min(1, "Pick a PREP ingredient to produce"),
  yieldQuantity: z.coerce.number().positive(),
  yieldUnit: z.string().min(1).max(20),
  description: z.string().max(1000).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
  ingredients: z.array(ingredientLine).min(1, "At least one ingredient is required"),
  steps: z.array(stepLine).default([]),
});

export const productionSchema = z.object({
  producedQty: z.coerce.number().positive(),
  note: z.string().max(200).optional().or(z.literal("")),
});

export type PrepRecipeInput = z.infer<typeof prepRecipeSchema>;
export type ProductionInput = z.infer<typeof productionSchema>;
