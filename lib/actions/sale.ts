"use server";

import { revalidatePath } from "next/cache";
import { MovementType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { saleSchema, type SaleInput } from "@/lib/validations/sale";
import { deductStockFIFO } from "@/lib/stock/fifo";
import { convert, getBaseUnit } from "@/lib/units/conversion";

export async function listSales() {
  const userId = await getCurrentUserId();
  return prisma.sale.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          recipe: { select: { id: true, name: true } },
          recipeSize: { select: { id: true, sizeName: true } },
        },
      },
    },
    orderBy: { saleDate: "desc" },
    take: 100,
  });
}

export async function listSaleRecipeSizes() {
  const userId = await getCurrentUserId();
  return prisma.recipeSize.findMany({
    where: { recipe: { userId, isDeleted: false, recipeType: "SALE" } },
    include: {
      recipe: { select: { id: true, name: true, sellPrice: true } },
    },
    orderBy: [{ recipe: { name: "asc" } }, { order: "asc" }],
  });
}

export type SaleResult =
  | { ok: true; id: string; saleNo: string }
  | { ok: false; error: string };

function toBase(quantity: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return quantity;
  const fromBase = getBaseUnit(fromUnit);
  const toBase = getBaseUnit(toUnit);
  if (fromBase && toBase && fromBase === toBase) {
    return convert(quantity, fromUnit, toUnit);
  }
  return quantity;
}

async function nextSaleNo(userId: string, date: Date): Promise<string> {
  const yyyymmdd = date.toISOString().slice(0, 10).replace(/-/g, "");
  const todaysSales = await prisma.sale.count({
    where: {
      userId,
      saleNo: { startsWith: `S-${yyyymmdd}-` },
    },
  });
  return `S-${yyyymmdd}-${String(todaysSales + 1).padStart(3, "0")}`;
}

export async function recordSale(input: SaleInput): Promise<SaleResult> {
  const userId = await getCurrentUserId();
  const parsed = saleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  const data = parsed.data;

  // Hydrate each line with its recipe size + ingredients
  const sizes = await prisma.recipeSize.findMany({
    where: {
      id: { in: data.items.map((i) => i.recipeSizeId) },
      recipe: { userId, isDeleted: false, recipeType: "SALE" },
    },
    include: {
      recipe: { select: { id: true, name: true, sellPrice: true } },
      ingredients: {
        include: { ingredient: { select: { id: true, name: true, baseUnit: true } } },
      },
    },
  });

  if (sizes.length !== new Set(data.items.map((i) => i.recipeSizeId)).size) {
    return { ok: false, error: "Recipe size missing" };
  }
  const sizeById = new Map(sizes.map((s) => [s.id, s]));

  // Aggregate required ingredient quantities
  const required = new Map<string, { qty: number; baseUnit: string; name: string }>();
  for (const item of data.items) {
    const size = sizeById.get(item.recipeSizeId)!;
    for (const ri of size.ingredients) {
      if (ri.isOptional) continue;
      const neededBase = toBase(ri.quantity * item.quantity, ri.unit, ri.ingredient.baseUnit);
      const prev = required.get(ri.ingredientId);
      required.set(ri.ingredientId, {
        qty: (prev?.qty ?? 0) + neededBase,
        baseUnit: ri.ingredient.baseUnit,
        name: ri.ingredient.name,
      });
    }
  }

  // Pre-check stock so we fail fast before opening transaction
  for (const [ingredientId, req] of required) {
    const agg = await prisma.stockBatch.aggregate({
      where: { ingredientId, ingredient: { userId }, status: "ACTIVE" },
      _sum: { quantity: true },
    });
    if ((agg._sum.quantity ?? 0) + 1e-9 < req.qty) {
      return {
        ok: false,
        error: `Insufficient stock for ${req.name}: need ${req.qty.toFixed(2)} ${req.baseUnit}`,
      };
    }
  }

  const now = new Date();
  const saleNo = await nextSaleNo(userId, now);

  const sale = await prisma.$transaction(async (tx) => {
    let total = 0;
    const createdSale = await tx.sale.create({
      data: {
        saleNo,
        saleDate: now,
        notes: data.notes || null,
        userId,
        totalAmount: 0,
      },
    });

    for (const item of data.items) {
      const size = sizeById.get(item.recipeSizeId)!;
      const unitPrice = size.recipe.sellPrice ?? 0;
      const totalPrice = unitPrice * item.quantity;
      total += totalPrice;
      await tx.saleItem.create({
        data: {
          saleId: createdSale.id,
          recipeId: size.recipe.id,
          recipeSizeId: size.id,
          quantity: item.quantity,
          unitPrice,
          totalPrice,
        },
      });
    }

    for (const [ingredientId, req] of required) {
      await deductStockFIFO(tx, {
        ingredientId,
        userId,
        quantity: req.qty,
        unit: req.baseUnit,
        reason: `Sale ${saleNo}`,
        movementType: MovementType.OUT,
        saleId: createdSale.id,
      });
    }

    return tx.sale.update({
      where: { id: createdSale.id },
      data: { totalAmount: total },
    });
  });

  revalidatePath("/sales");
  revalidatePath("/stock");
  return { ok: true, id: sale.id, saleNo: sale.saleNo };
}
