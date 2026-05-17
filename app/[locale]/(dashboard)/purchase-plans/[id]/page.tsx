import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getPurchasePlan,
  calculatePlanShoppingList,
} from "@/lib/actions/purchase-plan";

export default async function PurchasePlanDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const t = await getTranslations("purchase");
  const plan = await getPurchasePlan(id);
  if (!plan) notFound();
  const list = await calculatePlanShoppingList(id);

  return (
    <main className="flex-1 p-6 pb-20 md:pb-6 max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{plan.name}</h1>
          {plan.targetDate && (
            <p className="text-muted-foreground">
              {t("targetDate")}: {plan.targetDate.toISOString().slice(0, 10)}
            </p>
          )}
        </div>
        <Button asChild variant="outline" size="sm" className="gap-1">
          <a
            href={`/${locale}/print/shopping-list/${plan.id}`}
            target="_blank"
            rel="noopener"
          >
            <Printer className="h-4 w-4" /> {t("print")}
          </a>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("items")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm space-y-1">
            {plan.items.map((i) => (
              <li key={i.id}>
                {i.recipeSize.recipe.name} — {i.recipeSize.sizeName} × {i.targetQty}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("rawNeeded")}</CardTitle>
        </CardHeader>
        <CardContent>
          {list && list.results.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingredient</TableHead>
                    <TableHead>{t("needed")}</TableHead>
                    <TableHead>{t("inStock")}</TableHead>
                    <TableHead>{t("toBuy")}</TableHead>
                    <TableHead>Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.results.map((r) => (
                    <TableRow key={r.ingredientId}>
                      <TableCell>{r.ingredientName}</TableCell>
                      <TableCell className="tabular-nums">
                        {r.needed.toFixed(2)} {r.baseUnit}
                      </TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {r.inStock.toFixed(2)} {r.baseUnit}
                      </TableCell>
                      <TableCell
                        className={
                          r.toBuy > 0
                            ? "font-semibold tabular-nums"
                            : "text-muted-foreground tabular-nums"
                        }
                      >
                        {r.toBuy.toFixed(2)} {r.baseUnit}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {r.estimatedCost !== null
                          ? `฿${r.estimatedCost.toFixed(2)}`
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {list.estimatedTotal !== null && (
                <p className="mt-4 text-right font-semibold">
                  Estimated total: ฿{list.estimatedTotal.toFixed(2)}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No items.</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
