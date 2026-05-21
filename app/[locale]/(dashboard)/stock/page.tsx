import { getTranslations } from "next-intl/server";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { listStock } from "@/lib/actions/stock";
import { listIngredientsForPicker } from "@/lib/actions/ingredient";
import { AddBatchDialog } from "@/components/stock/AddBatchDialog";
import { DiscardBatchButton } from "@/components/stock/DiscardBatchButton";
import { SearchInput } from "@/components/shared/SearchInput";

function daysUntil(date: Date | null): number | null {
  if (!date) return null;
  return Math.floor((date.getTime() - Date.now()) / 86400_000);
}

function formatDate(d: Date | null): string {
  if (!d) return "-";
  return d.toISOString().slice(0, 10);
}

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const t = await getTranslations("stock");
  const tCommon = await getTranslations("common");
  const tIngredient = await getTranslations("ingredient");

  const [stock, ingredients] = await Promise.all([
    listStock({ search: q }),
    listIngredientsForPicker(),
  ]);

  return (
    <main className="flex-1 p-6 pb-20 md:pb-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <AddBatchDialog
          ingredients={ingredients.map((i) => ({
            id: i.id,
            name: i.name,
            baseUnit: i.baseUnit,
            type: i.type,
          }))}
          labels={{
            trigger: t("addBatch"),
            title: t("addBatch"),
            ingredient: tIngredient("name"),
            quantity: t("quantity"),
            preparedAt: t("purchasedAt"),
            totalCost: "Total cost (THB)",
            notes: tCommon("save"),
            save: tCommon("save"),
            cancel: tCommon("cancel"),
            saved: t("batchAdded"),
          }}
        />
      </div>

      <SearchInput key={q ?? ""} placeholder={tCommon("search")} />

      <div className="rounded-lg border divide-y bg-card">
        {stock.length === 0 && (
          <p className="p-6 text-sm text-muted-foreground">{tCommon("empty")}</p>
        )}
        {stock.map((ing) => {
          const isLow =
            ing.minStockAlert !== null && ing.totalActive < ing.minStockAlert;
          const isOut = ing.totalActive <= 0;
          // Auto-expand items needing attention
          const defaultOpen = isOut || isLow;

          return (
            <details
              key={ing.id}
              open={defaultOpen}
              className="group"
            >
              <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/40 list-none">
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-open:rotate-90" />
                <div className="min-w-0 flex-1 flex items-center gap-2">
                  <span className="font-medium truncate">{ing.name}</span>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {ing.type}
                  </Badge>
                </div>
                <span
                  className={
                    "text-sm tabular-nums shrink-0 " +
                    (isOut
                      ? "text-destructive font-semibold"
                      : isLow
                        ? "text-amber-600 font-semibold"
                        : "text-muted-foreground")
                  }
                >
                  {ing.totalActive.toFixed(2)} {ing.baseUnit}
                </span>
                <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">
                  {ing.batches.length} {t("batches").toLowerCase()}
                </span>
                {isOut ? (
                  <Badge variant="destructive" className="shrink-0">
                    {t("noStock")}
                  </Badge>
                ) : isLow ? (
                  <Badge className="bg-amber-100 text-amber-800 shrink-0">
                    {t("lowStock")}
                  </Badge>
                ) : null}
              </summary>

              {ing.batches.length === 0 ? (
                <p className="px-12 pb-3 text-xs text-muted-foreground">
                  {t("noBatches")}
                </p>
              ) : (
                <ul className="px-12 pb-3 space-y-1.5">
                  {ing.batches.map((b) => {
                    const dleft = daysUntil(b.expiresAt);
                    const expiring = dleft !== null && dleft <= 2;
                    return (
                      <li
                        key={b.id}
                        className="flex items-center gap-3 text-sm border-l-2 border-muted pl-3 py-1"
                      >
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {b.source}
                        </Badge>
                        <span className="text-muted-foreground tabular-nums shrink-0">
                          {formatDate(b.preparedAt)}
                        </span>
                        {b.expiresAt && (
                          <span
                            className={
                              "text-xs shrink-0 " +
                              (expiring
                                ? "text-amber-600 font-semibold"
                                : "text-muted-foreground")
                            }
                          >
                            → {formatDate(b.expiresAt)}
                            {dleft !== null && ` (${dleft}d)`}
                          </span>
                        )}
                        <span className="ml-auto tabular-nums">
                          {b.quantity.toFixed(2)} / {b.initialQuantity.toFixed(2)}{" "}
                          {ing.baseUnit}
                        </span>
                        <DiscardBatchButton
                          batchId={b.id}
                          labels={{
                            discard: t("discard"),
                            discardConfirm: t("discardConfirm"),
                            discardReason: t("discardReason"),
                            cancel: tCommon("cancel"),
                            confirm: tCommon("confirm"),
                            discarded: t("batchDiscarded"),
                          }}
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </details>
          );
        })}
      </div>
    </main>
  );
}
