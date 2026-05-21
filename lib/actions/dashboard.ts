import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";

export const getSalesTodayStat = cache(async () => {
  const userId = await getCurrentUserId();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const agg = await prisma.sale.aggregate({
    where: { userId, saleDate: { gte: today }, status: "COMPLETED" },
    _sum: { totalAmount: true },
    _count: { _all: true },
  });
  return {
    count: agg._count._all,
    total: agg._sum.totalAmount ?? 0,
  };
});

export const getLowStockStat = cache(async () => {
  const userId = await getCurrentUserId();
  const alertIngredients = await prisma.ingredient.findMany({
    where: { userId, isDeleted: false, minStockAlert: { not: null } },
    select: { id: true, name: true, baseUnit: true, minStockAlert: true },
  });
  if (alertIngredients.length === 0) return [];

  const totals = await prisma.stockBatch.groupBy({
    by: ["ingredientId"],
    where: {
      status: "ACTIVE",
      ingredientId: { in: alertIngredients.map((i) => i.id) },
    },
    _sum: { quantity: true },
  });
  const totalByIngredient = new Map(
    totals.map((t) => [t.ingredientId, t._sum.quantity ?? 0]),
  );

  return alertIngredients
    .map((i) => ({
      id: i.id,
      name: i.name,
      baseUnit: i.baseUnit,
      threshold: i.minStockAlert!,
      total: totalByIngredient.get(i.id) ?? 0,
    }))
    .filter((i) => i.total < i.threshold)
    .sort((a, b) => a.total - b.total);
});

export const getExpiringSoonStat = cache(async () => {
  const userId = await getCurrentUserId();
  const now = new Date();
  const in3Days = new Date(now.getTime() + 3 * 86400_000);
  const batches = await prisma.stockBatch.findMany({
    where: {
      ingredient: { userId },
      status: "ACTIVE",
      expiresAt: { gte: now, lte: in3Days },
    },
    select: {
      id: true,
      quantity: true,
      expiresAt: true,
      ingredient: { select: { name: true, baseUnit: true } },
    },
    orderBy: { expiresAt: "asc" },
    take: 20,
  });
  return batches.map((b) => ({
    id: b.id,
    ingredientName: b.ingredient.name,
    baseUnit: b.ingredient.baseUnit,
    quantity: b.quantity,
    expiresAt: b.expiresAt!,
  }));
});

export const getSaleRecipesCount = cache(async () => {
  const userId = await getCurrentUserId();
  return prisma.recipe.count({
    where: { userId, isDeleted: false, recipeType: "SALE" },
  });
});
