import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getIngredient } from "@/lib/actions/ingredient";
import { VariantsPanel } from "@/components/ingredient/VariantsPanel";
import { IngredientActions } from "@/components/ingredient/IngredientActions";

export default async function IngredientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ingredient = await getIngredient(id);
  if (!ingredient) notFound();

  const t = await getTranslations("ingredient");
  const tCommon = await getTranslations("common");

  return (
    <main className="flex-1 p-6 pb-20 md:pb-6 max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{ingredient.name}</h1>
          {ingredient.nameEn && (
            <p className="text-muted-foreground">{ingredient.nameEn}</p>
          )}
          <div className="flex gap-2 pt-2">
            <Badge variant={ingredient.type === "PREP" ? "default" : "secondary"}>
              {ingredient.type}
            </Badge>
            <Badge variant="outline">{ingredient.baseUnit}</Badge>
            {ingredient.shelfLifeDays && (
              <Badge variant="outline">
                {ingredient.shelfLifeDays} {t("shelfLifeDays")}
              </Badge>
            )}
          </div>
        </div>
        <IngredientActions
          ingredientId={ingredient.id}
          labels={{
            edit: tCommon("edit"),
            delete: tCommon("delete"),
            deleteConfirm: t("deleteConfirm", { name: ingredient.name }),
            cancel: tCommon("cancel"),
            confirm: tCommon("confirm"),
            deleted: t("deleted"),
          }}
        />
      </div>

      {ingredient.minStockAlert && (
        <Card>
          <CardContent className="pt-6 text-sm">
            {t("minStockAlert")}:{" "}
            <span className="font-medium">
              {ingredient.minStockAlert} {ingredient.baseUnit}
            </span>
          </CardContent>
        </Card>
      )}

      <VariantsPanel
        ingredientId={ingredient.id}
        variants={ingredient.variants.map((v) => ({
          id: v.id,
          brand: v.brand,
          packageSize: v.packageSize,
          packageUnit: v.packageUnit,
          price: v.price,
          pricePerBaseUnit: v.pricePerBaseUnit,
          supplier: v.supplier,
        }))}
        defaultVariantId={ingredient.defaultVariantId}
        baseUnit={ingredient.baseUnit}
        labels={{
          variants: t("variants"),
          addVariant: t("addVariant"),
          brand: t("brand"),
          packageSize: t("packageSize"),
          packageUnit: t("packageUnit"),
          price: t("price"),
          pricePerBase: t("pricePerBase"),
          supplier: t("supplier"),
          default: t("default"),
          setDefault: t("setDefault"),
          cheapest: t("cheapest"),
          emptyVariants: t("emptyVariants"),
          remove: tCommon("delete"),
          save: tCommon("save"),
          variantAdded: t("variantAdded"),
        }}
      />
    </main>
  );
}
