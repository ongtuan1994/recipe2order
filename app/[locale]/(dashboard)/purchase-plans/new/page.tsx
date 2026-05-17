import { getTranslations } from "next-intl/server";
import { PurchasePlanForm } from "@/components/purchase/PurchasePlanForm";
import { listSaleRecipeSizes } from "@/lib/actions/sale";

export default async function NewPurchasePlanPage() {
  const t = await getTranslations("purchase");
  const tCommon = await getTranslations("common");
  const sizes = await listSaleRecipeSizes();

  return (
    <main className="flex-1 p-6 pb-20 md:pb-6 max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">{t("new")}</h1>
      <PurchasePlanForm
        sizes={sizes.map((s) => ({
          id: s.id,
          label: `${s.recipe.name} — ${s.sizeName}`,
        }))}
        labels={{
          name: t("name"),
          targetDate: t("targetDate"),
          items: t("items"),
          addItem: t("addItem"),
          pickSize: "Recipe / Size",
          qty: "Target qty",
          save: tCommon("save"),
          cancel: tCommon("cancel"),
          saved: t("saved"),
          remove: tCommon("delete"),
        }}
      />
    </main>
  );
}
