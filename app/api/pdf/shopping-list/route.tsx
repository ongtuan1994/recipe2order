import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getCurrentUserId } from "@/lib/auth-helpers";
import {
  getPurchasePlan,
  calculatePlanShoppingList,
} from "@/lib/actions/purchase-plan";
import { ShoppingListPDF } from "@/lib/pdf/shopping-list";

export async function GET(req: Request) {
  await getCurrentUserId(); // gate
  const { searchParams } = new URL(req.url);
  const planId = searchParams.get("planId");
  if (!planId) {
    return NextResponse.json({ error: "Missing planId" }, { status: 400 });
  }

  const plan = await getPurchasePlan(planId);
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const list = await calculatePlanShoppingList(planId);
  if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const buffer = await renderToBuffer(
    <ShoppingListPDF
      planName={plan.name}
      targetDate={plan.targetDate ? plan.targetDate.toISOString().slice(0, 10) : null}
      items={list.results.map((r) => ({
        name: r.ingredientName,
        needed: r.needed,
        inStock: r.inStock,
        toBuy: r.toBuy,
        baseUnit: r.baseUnit,
        estimatedCost: r.estimatedCost,
      }))}
      estimatedTotal={list.estimatedTotal}
    />,
  );

  return new NextResponse(buffer as unknown as ArrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="shopping-list-${plan.name}.pdf"`,
    },
  });
}
