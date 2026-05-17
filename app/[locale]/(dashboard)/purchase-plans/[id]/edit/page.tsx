import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PurchasePlanForm } from "@/components/purchase/PurchasePlanForm";
import { getPurchasePlan } from "@/lib/actions/purchase-plan";
import { listSaleRecipeSizes } from "@/lib/actions/sale";

export default async function EditPurchasePlanPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const [plan, sizes, t, tCommon] = await Promise.all([
    getPurchasePlan(id),
    listSaleRecipeSizes(),
    getTranslations("purchase"),
    getTranslations("common"),
  ]);

  if (!plan) notFound();
  if (plan.status !== "DRAFT") redirect(`/${locale}/purchase-plans/${id}`);

  return (
    <main className="flex-1 p-6 pb-20 md:pb-6 max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">
        {tCommon("edit")} — {plan.name}
      </h1>
      <PurchasePlanForm
        planId={plan.id}
        initialValues={{
          name: plan.name,
          targetDate: plan.targetDate
            ? plan.targetDate.toISOString().slice(0, 10)
            : "",
          items: plan.items.map((i) => ({
            recipeSizeId: i.recipeSizeId,
            targetQty: i.targetQty,
          })),
        }}
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
