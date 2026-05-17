import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";

export async function exportIngredientsXLSX(userId: string): Promise<Buffer> {
  const ingredients = await prisma.ingredient.findMany({
    where: { userId, isDeleted: false },
    include: { variants: true, defaultVariant: true },
    orderBy: { name: "asc" },
  });

  const ingredientRows = ingredients.map((i) => ({
    id: i.id,
    name: i.name,
    nameEn: i.nameEn ?? "",
    type: i.type,
    baseUnit: i.baseUnit,
    shelfLifeDays: i.shelfLifeDays ?? "",
    minStockAlert: i.minStockAlert ?? "",
    defaultBrand: i.defaultVariant?.brand ?? "",
    defaultPricePerBaseUnit: i.defaultVariant?.pricePerBaseUnit ?? "",
  }));

  const variantRows = ingredients.flatMap((i) =>
    i.variants.map((v) => ({
      ingredientId: i.id,
      ingredientName: i.name,
      brand: v.brand,
      packageSize: v.packageSize,
      packageUnit: v.packageUnit,
      price: v.price,
      pricePerBaseUnit: v.pricePerBaseUnit,
      supplier: v.supplier ?? "",
      isDefault: i.defaultVariantId === v.id ? "yes" : "",
    })),
  );

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(ingredientRows),
    "Ingredients",
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(variantRows),
    "Variants",
  );

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
