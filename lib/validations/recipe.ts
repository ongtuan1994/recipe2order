import { z } from "zod";

const recipeIngredientSchema = z.object({
  ingredientId: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unit: z.string().min(1).max(20),
  note: z.string().max(200).optional().or(z.literal("")),
  isOptional: z.boolean().default(false),
});

const recipeStepSchema = z
  .object({
    title: z.string().max(120).optional().or(z.literal("")),
    detail: z.string().max(2000).optional().or(z.literal("")),
  })
  .refine((s) => (s.title?.trim()?.length ?? 0) > 0 || (s.detail?.trim()?.length ?? 0) > 0, {
    message: "Step needs a title or detail",
    path: ["title"],
  });

const recipeSizeSchema = z.object({
  sizeName: z.string().min(1).max(40),
  ingredients: z.array(recipeIngredientSchema).min(1, "At least one ingredient is required"),
  steps: z.array(recipeStepSchema).default([]),
});

export const saleRecipeSchema = z.object({
  name: z.string().min(1).max(120),
  nameEn: z.string().max(120).optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  sellPrice: z.coerce.number().positive().optional().or(z.nan()),
  description: z.string().max(1000).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
  sizes: z.array(recipeSizeSchema).min(1, "At least one size is required"),
});

export type SaleRecipeInput = z.infer<typeof saleRecipeSchema>;
export type RecipeSizeInput = z.infer<typeof recipeSizeSchema>;
export type RecipeIngredientInput = z.infer<typeof recipeIngredientSchema>;
export type RecipeStepInput = z.infer<typeof recipeStepSchema>;
