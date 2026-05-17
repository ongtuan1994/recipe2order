import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { IngredientForm } from "@/components/ingredient/IngredientForm";
import { getIngredient } from "@/lib/actions/ingredient";

export default async function EditIngredientPage({
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
    <main className="flex-1 p-6 pb-20 md:pb-6 max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">{t("edit")}</h1>
      <IngredientForm
        mode="edit"
        ingredientId={ingredient.id}
        defaultValues={{
          name: ingredient.name,
          nameEn: ingredient.nameEn ?? "",
          type: ingredient.type as "RAW" | "PREP",
          baseUnit: ingredient.baseUnit,
          shelfLifeDays: ingredient.shelfLifeDays ?? undefined,
          minStockAlert: ingredient.minStockAlert ?? undefined,
        }}
        labels={{
          name: t("name"),
          nameEn: t("nameEn"),
          type: t("type"),
          raw: t("raw"),
          prep: t("prep"),
          baseUnit: t("baseUnit"),
          shelfLifeDays: t("shelfLifeDays"),
          minStockAlert: t("minStockAlert"),
          save: tCommon("save"),
          cancel: tCommon("cancel"),
          saved: t("saved"),
        }}
        cancelHref={`/ingredients/${ingredient.id}`}
      />
    </main>
  );
}
