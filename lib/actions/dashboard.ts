"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";

export async function getDashboardSummary() {
  const userId = await getCurrentUserId();
  const now = new Date();
  const in3Days = new Date(now.getTime() + 3 * 86400_000);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [ingredients, expiringSoon, salesToday, totalRecipes] = await Promise.all([
    prisma.ingredient.findMany({
      where: { userId, isDeleted: false, minStockAlert: { not: null } },
      include: { batches: { where: { status: "ACTIVE" }, select: { quantity: true } } },
    }),
    prisma.stockBatch.findMany({
      where: {
        ingredient: { userId },
        status: "ACTIVE",
        expiresAt: { gte: now, lte: in3Days },
      },
      include: {
        ingredient: { select: { name: true, baseUnit: true } },
      },
      orderBy: { expiresAt: "asc" },
      take: 20,
    }),
    prisma.sale.aggregate({
      where: { userId, saleDate: { gte: today }, status: "COMPLETED" },
      _sum: { totalAmount: true },
      _count: { _all: true },
    }),
    prisma.recipe.count({
      where: { userId, isDeleted: false, recipeType: "SALE" },
    }),
  ]);

  const lowStock = ingredients
    .map((i) => ({
      id: i.id,
      name: i.name,
      baseUnit: i.baseUnit,
      threshold: i.minStockAlert!,
      total: i.batches.reduce((s, b) => s + b.quantity, 0),
    }))
    .filter((i) => i.total < i.threshold)
    .sort((a, b) => a.total - b.total);

  return {
    lowStock,
    expiringSoon: expiringSoon.map((b) => ({
      id: b.id,
      ingredientName: b.ingredient.name,
      baseUnit: b.ingredient.baseUnit,
      quantity: b.quantity,
      expiresAt: b.expiresAt!,
    })),
    salesToday: {
      count: salesToday._count._all,
      total: salesToday._sum.totalAmount ?? 0,
    },
    totalRecipes,
  };
}
