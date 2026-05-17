import { getTranslations } from "next-intl/server";
import { IngredientForm } from "@/components/ingredient/IngredientForm";

export default async function NewIngredientPage() {
  const t = await getTranslations("ingredient");
  const tCommon = await getTranslations("common");

  return (
    <main className="flex-1 p-6 pb-20 md:pb-6 max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">{t("new")}</h1>
      <IngredientForm
        mode="create"
        defaultValues={{
          name: "",
          nameEn: "",
          type: "RAW",
          baseUnit: "g",
          shelfLifeDays: undefined,
          minStockAlert: undefined,
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
        cancelHref="/ingredients"
      />
    </main>
  );
}
