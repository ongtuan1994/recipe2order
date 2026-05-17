import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { exportRecipesXLSX } from "@/lib/excel/recipe-export";

export async function GET() {
  const userId = await getCurrentUserId();
  const buf = await exportRecipesXLSX(userId);
  return new NextResponse(buf as unknown as ArrayBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="recipes-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx"`,
    },
  });
}
