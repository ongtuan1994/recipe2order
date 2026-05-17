import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MovementType } from "@prisma/client";

// Vercel Cron hits this with `Authorization: Bearer <CRON_SECRET>`.
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const expired = await prisma.stockBatch.findMany({
    where: { status: "ACTIVE", expiresAt: { lt: now } },
    include: { ingredient: { select: { userId: true, baseUnit: true } } },
  });

  let count = 0;
  for (const b of expired) {
    await prisma.$transaction([
      prisma.stockBatch.update({
        where: { id: b.id },
        data: { status: "EXPIRED" },
      }),
      prisma.stockMovement.create({
        data: {
          batchId: b.id,
          ingredientId: b.ingredientId,
          type: MovementType.EXPIRED,
          quantity: -b.quantity,
          unit: b.ingredient.baseUnit,
          reason: "Auto-expired (cron)",
          userId: b.ingredient.userId,
        },
      }),
    ]);
    count += 1;
  }

  return NextResponse.json({ ok: true, expired: count });
}
