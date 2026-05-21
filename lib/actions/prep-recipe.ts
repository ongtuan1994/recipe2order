"use server";

import { revalidatePath } from "next/cache";
import { RecipeType, BatchSource, MovementType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";
import {
  prepRecipeSchema,
  productionSchema,
  type PrepRecipeInput,
  type ProductionInput,
} from "@/lib/validations/prep-recipe";
import { convert, getBaseUnit } from "@/lib/units/conversion";

export async function listPrepRecipes() {
  const userId = await getCurrentUserId();
  return prisma.recipe.findMany({
    where: { userId, isDeleted: false, recipeType: RecipeType.PREP },
    include: {
      outputIngredient: { select: { id: true, name: true, baseUnit: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

/** Returns prev/next prep-recipe ids in the same order the list page uses. */
export async function getPrepRecipeNeighbors(currentId: string) {
  const userId = await getCurrentUserId();
  const rows = await prisma.recipe.findMany({
    where: { userId, isDeleted: false, recipeType: RecipeType.PREP },
    select: { id: true },
    orderBy: { updatedAt: "desc" },
  });
  const idx = rows.findIndex((r) => r.id === currentId);
  return {
    prevId: idx > 0 ? rows[idx - 1].id : null,
    nextId: idx >= 0 && idx < rows.length - 1 ? rows[idx + 1].id : null,
    position: idx >= 0 ? idx + 1 : 0,
    total: rows.length,
  };
}

export async function getPrepRecipe(id: string) {
  const userId = await getCurrentUserId();
  return prisma.recipe.findFirst({
    where: { id, userId, isDeleted: false, recipeType: RecipeType.PREP },
    include: {
      outputIngredient: true,
      prepIngredients: {
        orderBy: { order: "asc" },
        include: { ingredient: { select: { id: true, name: true, baseUnit: true } } },
      },
      prepSteps: { orderBy: { stepNo: "asc" } },
    },
  });
}

export async function listAvailablePrepIngredients(includeId?: string) {
  const userId = await getCurrentUserId();
  return prisma.ingredient.findMany({
    where: {
      userId,
      isDeleted: false,
      type: "PREP",
      OR: [
        { prepRecipeId: null },
        ...(includeId ? [{ prepRecipeId: includeId }] : []),
      ],
    },
    select: { id: true, name: true, baseUnit: true, prepRecipeId: true },
    orderBy: { name: "asc" },
  });
}

export type PrepMutationResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

function buildIngredientsCreate(items: PrepRecipeInput["ingredients"]) {
  return items.map((ing, idx) => ({
    ingredientId: ing.ingredientId,
    quantity: ing.quantity,
    unit: ing.unit,
    note: ing.note?.trim() || null,
    isOptional: ing.isOptional ?? false,
    order: idx,
  }));
}

function buildStepsCreate(steps: PrepRecipeInput["steps"]) {
  return steps.map((step, idx) => ({
    stepNo: idx + 1,
    title: step.title?.trim() || null,
    detail: step.detail?.trim() || null,
  }));
}

export async function createPrepRecipe(input: PrepRecipeInput): Promise<PrepMutationResult> {
  const userId = await getCurrentUserId();
  const parsed = prepRecipeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  const data = parsed.data;

  const outputIng = await prisma.ingredient.findFirst({
    where: {
      id: data.outputIngredientId,
      userId,
      type: "PREP",
      prepRecipeId: null,
      isDeleted: false,
    },
  });
  if (!outputIng) {
    return { ok: false, error: "Output ingredient unavailable" };
  }

  const recipe = await prisma.recipe.create({
    data: {
      name: data.name,
      nameEn: data.nameEn || null,
      recipeType: RecipeType.PREP,
      description: data.description || null,
      notes: data.notes || null,
      yieldQuantity: data.yieldQuantity,
      yieldUnit: data.yieldUnit,
      userId,
      prepIngredients: { create: buildIngredientsCreate(data.ingredients) },
      prepSteps: { create: buildStepsCreate(data.steps) },
    },
    select: { id: true },
  });

  await prisma.ingredient.update({
    where: { id: outputIng.id },
    data: { prepRecipeId: recipe.id },
  });

  revalidatePath("/prep-recipes");
  return { ok: true, id: recipe.id };
}

export async function updatePrepRecipe(
  id: string,
  input: PrepRecipeInput,
): Promise<PrepMutationResult> {
  const userId = await getCurrentUserId();
  const parsed = prepRecipeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  const data = parsed.data;

  const existing = await prisma.recipe.findFirst({
    where: { id, userId, isDeleted: false, recipeType: RecipeType.PREP },
    include: { outputIngredient: { select: { id: true } } },
  });
  if (!existing) return { ok: false, error: "Not found" };

  if (data.outputIngredientId !== existing.outputIngredient?.id) {
    const newOutput = await prisma.ingredient.findFirst({
      where: {
        id: data.outputIngredientId,
        userId,
        type: "PREP",
        OR: [{ prepRecipeId: null }, { prepRecipeId: id }],
        isDeleted: false,
      },
    });
    if (!newOutput) return { ok: false, error: "Output ingredient unavailable" };
  }

  await prisma.$transaction([
    ...(existing.outputIngredient && existing.outputIngredient.id !== data.outputIngredientId
      ? [
          prisma.ingredient.update({
            where: { id: existing.outputIngredient.id },
            data: { prepRecipeId: null },
          }),
        ]
      : []),
    prisma.ingredient.update({
      where: { id: data.outputIngredientId },
      data: { prepRecipeId: id },
    }),
    prisma.recipeIngredient.deleteMany({ where: { prepRecipeId: id } }),
    prisma.recipeStep.deleteMany({ where: { prepRecipeId: id } }),
    prisma.recipe.update({
      where: { id },
      data: {
        name: data.name,
        nameEn: data.nameEn || null,
        description: data.description || null,
        notes: data.notes || null,
        yieldQuantity: data.yieldQuantity,
        yieldUnit: data.yieldUnit,
        prepIngredients: { create: buildIngredientsCreate(data.ingredients) },
        prepSteps: { create: buildStepsCreate(data.steps) },
      },
    }),
  ]);

  revalidatePath("/prep-recipes");
  revalidatePath(`/prep-recipes/${id}`);
  return { ok: true, id };
}

export async function deletePrepRecipe(id: string) {
  const userId = await getCurrentUserId();
  const recipe = await prisma.recipe.findFirst({
    where: { id, userId, isDeleted: false, recipeType: RecipeType.PREP },
    include: { outputIngredient: { select: { id: true } } },
  });
  if (!recipe) return;
  await prisma.$transaction([
    ...(recipe.outputIngredient
      ? [
          prisma.ingredient.update({
            where: { id: recipe.outputIngredient.id },
            data: { prepRecipeId: null },
          }),
        ]
      : []),
    prisma.recipe.update({ where: { id }, data: { isDeleted: true } }),
  ]);
  revalidatePath("/prep-recipes");
}

// ===== Production =====

export type ProductionResult =
  | { ok: true; batchId: string }
  | { ok: false; error: string };

function convertToBaseUnit(quantity: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return quantity;
  const fromBase = getBaseUnit(fromUnit);
  const toBase = getBaseUnit(toUnit);
  if (fromBase && toBase && fromBase === toBase) {
    return convert(quantity, fromUnit, toUnit);
  }
  return quantity;
}

export async function recordProduction(
  prepRecipeId: string,
  input: ProductionInput,
): Promise<ProductionResult> {
  const userId = await getCurrentUserId();
  const parsed = productionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  const { producedQty, note } = parsed.data;

  const recipe = await prisma.recipe.findFirst({
    where: { id: prepRecipeId, userId, isDeleted: false, recipeType: RecipeType.PREP },
    include: {
      outputIngredient: true,
      prepIngredients: { include: { ingredient: { select: { baseUnit: true, name: true } } } },
    },
  });
  if (!recipe || !recipe.outputIngredient || !recipe.yieldQuantity) {
    return { ok: false, error: "Prep recipe not ready (missing output or yield)" };
  }

  const ratio = producedQty / recipe.yieldQuantity;

  type Consumption = {
    ingredientId: string;
    needed: number;
    baseUnit: string;
    name: string;
  };
  const consumptions: Consumption[] = recipe.prepIngredients.map((ri) => ({
    ingredientId: ri.ingredientId,
    needed: convertToBaseUnit(ri.quantity * ratio, ri.unit, ri.ingredient.baseUnit),
    baseUnit: ri.ingredient.baseUnit,
    name: ri.ingredient.name,
  }));

  // Pre-check stock availability
  for (const c of consumptions) {
    const totalAvailable = await prisma.stockBatch.aggregate({
      where: { ingredientId: c.ingredientId, ingredient: { userId }, status: "ACTIVE" },
      _sum: { quantity: true },
    });
    if ((totalAvailable._sum.quantity ?? 0) + 1e-9 < c.needed) {
      return {
        ok: false,
        error: `Insufficient stock for ${c.name}`,
      };
    }
  }

  const now = new Date();
  const expiresAt = recipe.outputIngredient.shelfLifeDays
    ? new Date(now.getTime() + recipe.outputIngredient.shelfLifeDays * 86400_000)
    : null;
  const output = recipe.outputIngredient;

  const outputBatch = await prisma.$transaction(async (tx) => {
    const production = await tx.prepProduction.create({
      data: {
        prepRecipeId: recipe.id,
        batchesCount: Math.max(1, Math.round(ratio)),
        quantityProduced: producedQty,
        unit: output.baseUnit,
        notes: note || null,
        userId,
      },
    });

    // FIFO deduct each ingredient, recording PrepConsumption per batch hit
    for (const c of consumptions) {
      let remaining = c.needed;
      const batches = await tx.stockBatch.findMany({
        where: { ingredientId: c.ingredientId, ingredient: { userId }, status: "ACTIVE" },
        orderBy: [{ expiresAt: "asc" }, { createdAt: "asc" }],
      });
      for (const b of batches) {
        if (remaining <= 1e-9) break;
        const take = Math.min(b.quantity, remaining);
        const newQty = b.quantity - take;
        await tx.stockBatch.update({
          where: { id: b.id },
          data: {
            quantity: newQty,
            status: newQty <= 1e-9 ? "DEPLETED" : b.status,
          },
        });
        await tx.stockMovement.create({
          data: {
            batchId: b.id,
            ingredientId: c.ingredientId,
            type: MovementType.PREP_OUT,
            quantity: -take,
            unit: c.baseUnit,
            reason: `Prep production: ${recipe.name}`,
            prepProductionId: production.id,
            userId,
          },
        });
        await tx.prepConsumption.create({
          data: {
            prepProductionId: production.id,
            ingredientId: c.ingredientId,
            batchId: b.id,
            quantityUsed: take,
            unit: c.baseUnit,
          },
        });
        remaining -= take;
      }
      if (remaining > 1e-6) {
        throw new Error(`Stock changed during transaction for ${c.name}`);
      }
    }

    const batch = await tx.stockBatch.create({
      data: {
        ingredientId: output.id,
        quantity: producedQty,
        initialQuantity: producedQty,
        source: BatchSource.PREPARED,
        preparedAt: now,
        expiresAt,
        prepProductionId: production.id,
      },
    });

    await tx.stockMovement.create({
      data: {
        batchId: batch.id,
        ingredientId: output.id,
        type: MovementType.PREP_IN,
        quantity: producedQty,
        unit: output.baseUnit,
        reason: `Prep production: ${recipe.name}`,
        prepProductionId: production.id,
        userId,
      },
    });

    return batch;
  });

  revalidatePath("/stock");
  revalidatePath(`/prep-recipes/${prepRecipeId}`);
  return { ok: true, batchId: outputBatch.id };
}
