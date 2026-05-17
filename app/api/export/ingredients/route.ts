import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { exportIngredientsXLSX } from "@/lib/excel/ingredient-export";

export async function GET() {
  const userId = await getCurrentUserId();
  const buf = await exportIngredientsXLSX(userId);
  return new NextResponse(buf as unknown as ArrayBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="ingredients-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx"`,
    },
  });
}
