"use server";

import { revalidatePath } from "next/cache";
import { BatchSource, MovementType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";
import {
  purchaseBatchSchema,
  discardBatchSchema,
  type PurchaseBatchInput,
  type DiscardBatchInput,
} from "@/lib/validations/stock";

export async function listStock() {
  const userId = await getCurrentUserId();
  const ingredients = await prisma.ingredient.findMany({
    where: { userId, isDeleted: false },
    select: {
      id: true,
      name: true,
      type: true,
      baseUnit: true,
      minStockAlert: true,
      batches: {
        where: { status: "ACTIVE" },
        orderBy: [{ expiresAt: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          quantity: true,
          initialQuantity: true,
          preparedAt: true,
          expiresAt: true,
          source: true,
        },
      },
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
  return ingredients.map((i) => ({
    ...i,
    totalActive: i.batches.reduce((sum, b) => sum + b.quantity, 0),
  }));
}

export type StockMutationResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function addPurchaseBatch(
  input: PurchaseBatchInput,
): Promise<StockMutationResult> {
  const userId = await getCurrentUserId();
  const parsed = purchaseBatchSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  const data = parsed.data;

  const ingredient = await prisma.ingredient.findFirst({
    where: { id: data.ingredientId, userId, isDeleted: false },
    select: { id: true, baseUnit: true, shelfLifeDays: true },
  });
  if (!ingredient) return { ok: false, error: "Ingredient not found" };

  const preparedAt = data.preparedAt ? new Date(data.preparedAt) : new Date();
  const expiresAt = ingredient.shelfLifeDays
    ? new Date(preparedAt.getTime() + ingredient.shelfLifeDays * 86400_000)
    : null;
  const totalCost =
    typeof data.totalCost === "number" && !Number.isNaN(data.totalCost) && data.totalCost > 0
      ? data.totalCost
      : null;

  const batch = await prisma.$transaction(async (tx) => {
    const b = await tx.stockBatch.create({
      data: {
        ingredientId: ingredient.id,
        quantity: data.quantity,
        initialQuantity: data.quantity,
        preparedAt,
        expiresAt,
        source: BatchSource.PURCHASED,
        variantId: data.variantId || null,
        totalCost,
        notes: data.notes || null,
      },
    });
    await tx.stockMovement.create({
      data: {
        batchId: b.id,
        ingredientId: ingredient.id,
        type: MovementType.IN,
        quantity: data.quantity,
        unit: ingredient.baseUnit,
        reason: "Purchased",
        userId,
      },
    });
    return b;
  });

  revalidatePath("/stock");
  return { ok: true, id: batch.id };
}

export async function discardBatch(
  batchId: string,
  input: DiscardBatchInput,
): Promise<StockMutationResult> {
  const userId = await getCurrentUserId();
  const parsed = discardBatchSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  const { reason } = parsed.data;

  const batch = await prisma.stockBatch.findFirst({
    where: { id: batchId, ingredient: { userId }, status: "ACTIVE" },
    include: { ingredient: { select: { baseUnit: true } } },
  });
  if (!batch) return { ok: false, error: "Batch not found" };

  await prisma.$transaction([
    prisma.stockBatch.update({
      where: { id: batchId },
      data: { status: "DISCARDED", quantity: 0 },
    }),
    prisma.stockMovement.create({
      data: {
        batchId,
        ingredientId: batch.ingredientId,
        type: MovementType.DISCARD,
        quantity: -batch.quantity,
        unit: batch.ingredient.baseUnit,
        reason,
        userId,
      },
    }),
  ]);

  revalidatePath("/stock");
  return { ok: true, id: batchId };
}
