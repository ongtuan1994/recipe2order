"use server";

import { revalidatePath } from "next/cache";
import { Prisma, RecipeType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { saleRecipeSchema, type SaleRecipeInput } from "@/lib/validations/recipe";
import { redirect } from "@/i18n/navigation";

export type ListRecipesOptions = {
  search?: string;
  categoryId?: string;
};

export async function listSaleRecipes(opts: ListRecipesOptions = {}) {
  const userId = await getCurrentUserId();
  const where: Prisma.RecipeWhereInput = {
    userId,
    isDeleted: false,
    recipeType: RecipeType.SALE,
  };
  if (opts.search) {
    where.OR = [
      { name: { contains: opts.search, mode: "insensitive" } },
      { nameEn: { contains: opts.search, mode: "insensitive" } },
    ];
  }
  if (opts.categoryId) where.categoryId = opts.categoryId;

  return prisma.recipe.findMany({
    where,
    select: {
      id: true,
      name: true,
      nameEn: true,
      sellPrice: true,
      category: { select: { id: true, name: true, color: true } },
      sizes: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          sizeName: true,
          // Pulled so the page can compute cost-of-goods for the first size.
          ingredients: {
            select: { ingredientId: true, quantity: true, unit: true },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getSaleRecipe(id: string) {
  const userId = await getCurrentUserId();
  return prisma.recipe.findFirst({
    where: { id, userId, isDeleted: false, recipeType: RecipeType.SALE },
    include: {
      category: true,
      sizes: {
        orderBy: { order: "asc" },
        include: {
          ingredients: {
            orderBy: { order: "asc" },
            include: { ingredient: { select: { id: true, name: true, baseUnit: true } } },
          },
          steps: { orderBy: { stepNo: "asc" } },
        },
      },
    },
  });
}

export type RecipeMutationResult =
  | { ok: true; id: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

function normaliseSellPrice(value: SaleRecipeInput["sellPrice"]): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "number" && !Number.isNaN(value) && value > 0) return value;
  return null;
}

function buildSizesCreate(sizes: SaleRecipeInput["sizes"]) {
  return sizes.map((size, sIdx) => ({
    sizeName: size.sizeName,
    order: sIdx,
    ingredients: {
      create: size.ingredients.map((ing, iIdx) => ({
        ingredientId: ing.ingredientId,
        quantity: ing.quantity,
        unit: ing.unit,
        note: ing.note?.trim() || null,
        isOptional: ing.isOptional ?? false,
        order: iIdx,
      })),
    },
    steps: {
      create: size.steps.map((step, stepIdx) => ({
        stepNo: stepIdx + 1,
        title: step.title?.trim() || null,
        detail: step.detail?.trim() || null,
      })),
    },
  }));
}

export async function createRecipe(input: SaleRecipeInput): Promise<RecipeMutationResult> {
  const userId = await getCurrentUserId();
  const parsed = saleRecipeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Invalid input",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  const data = parsed.data;

  const recipe = await prisma.recipe.create({
    data: {
      name: data.name,
      nameEn: data.nameEn || null,
      recipeType: RecipeType.SALE,
      description: data.description || null,
      notes: data.notes || null,
      sellPrice: normaliseSellPrice(data.sellPrice),
      categoryId: data.categoryId || null,
      userId,
      sizes: { create: buildSizesCreate(data.sizes) },
    },
    select: { id: true },
  });

  revalidatePath("/recipes");
  return { ok: true, id: recipe.id };
}

export async function updateRecipe(
  id: string,
  input: SaleRecipeInput,
): Promise<RecipeMutationResult> {
  const userId = await getCurrentUserId();
  const parsed = saleRecipeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Invalid input",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  const data = parsed.data;

  const existing = await prisma.recipe.findFirst({
    where: { id, userId, isDeleted: false, recipeType: RecipeType.SALE },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "Recipe not found" };

  await prisma.$transaction([
    // Cascading delete of sizes also cascades to RecipeIngredient + RecipeStep.
    prisma.recipeSize.deleteMany({ where: { recipeId: id } }),
    prisma.recipe.update({
      where: { id },
      data: {
        name: data.name,
        nameEn: data.nameEn || null,
        description: data.description || null,
        notes: data.notes || null,
        sellPrice: normaliseSellPrice(data.sellPrice),
        categoryId: data.categoryId || null,
        sizes: { create: buildSizesCreate(data.sizes) },
      },
    }),
  ]);

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${id}`);
  return { ok: true, id };
}

export async function deleteRecipe(id: string) {
  const userId = await getCurrentUserId();
  await prisma.recipe.updateMany({
    where: { id, userId, isDeleted: false },
    data: { isDeleted: true },
  });
  revalidatePath("/recipes");
}

export async function duplicateRecipeAction(id: string, locale: string) {
  const userId = await getCurrentUserId();
  const source = await prisma.recipe.findFirst({
    where: { id, userId, isDeleted: false, recipeType: RecipeType.SALE },
    include: {
      sizes: {
        orderBy: { order: "asc" },
        include: {
          ingredients: { orderBy: { order: "asc" } },
          steps: { orderBy: { stepNo: "asc" } },
        },
      },
    },
  });
  if (!source) throw new Error("Recipe not found");

  const copy = await prisma.recipe.create({
    data: {
      name: `${source.name} (copy)`,
      nameEn: source.nameEn,
      recipeType: source.recipeType,
      description: source.description,
      notes: source.notes,
      sellPrice: source.sellPrice,
      categoryId: source.categoryId,
      userId,
      sizes: {
        create: source.sizes.map((s) => ({
          sizeName: s.sizeName,
          order: s.order,
          ingredients: {
            create: s.ingredients.map((ing) => ({
              ingredientId: ing.ingredientId,
              quantity: ing.quantity,
              unit: ing.unit,
              note: ing.note,
              isOptional: ing.isOptional,
              order: ing.order,
            })),
          },
          steps: {
            create: s.steps.map((step) => ({
              stepNo: step.stepNo,
              title: step.title,
              detail: step.detail,
            })),
          },
        })),
      },
    },
    select: { id: true },
  });

  revalidatePath("/recipes");
  redirect({ href: `/recipes/${copy.id}/edit`, locale });
}
