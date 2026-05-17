import { getTranslations } from "next-intl/server";
import { SaleForm } from "@/components/sale/SaleForm";
import { listSaleRecipeSizes } from "@/lib/actions/sale";

export default async function NewSalePage() {
  const t = await getTranslations("sale");
  const tCommon = await getTranslations("common");
  const sizes = await listSaleRecipeSizes();

  return (
    <main className="flex-1 p-6 pb-20 md:pb-6 max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">{t("new")}</h1>
      <SaleForm
        sizes={sizes.map((s) => ({
          id: s.id,
          label: `${s.recipe.name} — ${s.sizeName}`,
          unitPrice: s.recipe.sellPrice ?? 0,
        }))}
        labels={{
          items: t("items"),
          addItem: t("addItem"),
          pickSize: t("pickSize"),
          qty: t("qty"),
          totalAmount: t("totalAmount"),
          note: t("note"),
          save: tCommon("save"),
          cancel: tCommon("cancel"),
          recorded: t("recorded"),
          remove: tCommon("delete"),
        }}
      />
    </main>
  );
}
