import { MovementType, Prisma } from "@prisma/client";

export interface FifoDeduction {
  batchId: string;
  qty: number;
}

type TxClient = Prisma.TransactionClient;

/**
 * Deduct `quantity` (in the ingredient's baseUnit) from a single ingredient using FIFO.
 * Throws if available stock is less than requested.
 *
 * MUST be called inside a `prisma.$transaction(async tx => ...)` block — caller passes `tx`.
 */
export async function deductStockFIFO(
  tx: TxClient,
  args: {
    ingredientId: string;
    userId: string;
    quantity: number;
    unit: string;
    reason: string;
    movementType: MovementType;
    saleId?: string;
    prepProductionId?: string;
  },
): Promise<FifoDeduction[]> {
  const { ingredientId, userId, quantity, unit, reason, movementType } = args;
  if (quantity <= 0) return [];

  const batches = await tx.stockBatch.findMany({
    where: {
      ingredientId,
      ingredient: { userId },
      status: "ACTIVE",
      quantity: { gt: 0 },
    },
    orderBy: [{ expiresAt: "asc" }, { createdAt: "asc" }],
  });

  const total = batches.reduce((sum, b) => sum + b.quantity, 0);
  if (total + 1e-9 < quantity) {
    throw new Error(
      `Insufficient stock for ingredient ${ingredientId}: need ${quantity}, have ${total}`,
    );
  }

  const deductions: FifoDeduction[] = [];
  let remaining = quantity;

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
        ingredientId,
        type: movementType,
        quantity: -take,
        unit,
        reason,
        saleId: args.saleId,
        prepProductionId: args.prepProductionId,
        userId,
      },
    });

    deductions.push({ batchId: b.id, qty: take });
    remaining -= take;
  }

  return deductions;
}

/** Sum of ACTIVE stock for an ingredient (in baseUnit). */
export async function getActiveStock(
  client: Pick<Prisma.TransactionClient, "stockBatch"> | typeof import("@/lib/prisma").prisma,
  ingredientId: string,
  userId: string,
): Promise<number> {
  const agg = await client.stockBatch.aggregate({
    where: { ingredientId, ingredient: { userId }, status: "ACTIVE" },
    _sum: { quantity: true },
  });
  return agg._sum.quantity ?? 0;
}
