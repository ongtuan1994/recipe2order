import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listStock } from "@/lib/actions/stock";
import { listIngredientsForPicker } from "@/lib/actions/ingredient";
import { AddBatchDialog } from "@/components/stock/AddBatchDialog";
import { DiscardBatchButton } from "@/components/stock/DiscardBatchButton";

function daysUntil(date: Date | null): number | null {
  if (!date) return null;
  return Math.floor((date.getTime() - Date.now()) / 86400_000);
}

function formatDate(d: Date | null): string {
  if (!d) return "-";
  return d.toISOString().slice(0, 10);
}

export default async function StockPage() {
  const t = await getTranslations("stock");
  const tCommon = await getTranslations("common");
  const tIngredient = await getTranslations("ingredient");

  const [stock, ingredients] = await Promise.all([
    listStock(),
    listIngredientsForPicker(),
  ]);

  return (
    <main className="flex-1 p-6 pb-20 md:pb-6 space-y-6">
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

      <div className="space-y-4">
        {stock.map((ing) => {
          const isLow =
            ing.minStockAlert !== null && ing.totalActive < ing.minStockAlert;
          const isOut = ing.totalActive <= 0;
          return (
            <Card key={ing.id}>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base">
                    {ing.name}
                    <Badge variant="outline" className="ml-2">
                      {ing.type}
                    </Badge>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {t("totalAvailable")}:{" "}
                    <span
                      className={
                        isOut
                          ? "text-destructive font-semibold"
                          : isLow
                            ? "text-amber-600 font-semibold"
                            : "text-foreground tabular-nums"
                      }
                    >
                      {ing.totalActive.toFixed(2)} {ing.baseUnit}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2">
                  {isOut && <Badge variant="destructive">{t("noStock")}</Badge>}
                  {!isOut && isLow && (
                    <Badge className="bg-amber-100 text-amber-800">{t("lowStock")}</Badge>
                  )}
                </div>
              </CardHeader>
              {ing.batches.length > 0 && (
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("source")}</TableHead>
                        <TableHead>{t("preparedAt")}</TableHead>
                        <TableHead>{t("expiresAt")}</TableHead>
                        <TableHead>{t("quantity")}</TableHead>
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ing.batches.map((b) => {
                        const dleft = daysUntil(b.expiresAt);
                        const expiring = dleft !== null && dleft <= 2;
                        return (
                          <TableRow key={b.id}>
                            <TableCell>{b.source}</TableCell>
                            <TableCell className="tabular-nums">
                              {formatDate(b.preparedAt)}
                            </TableCell>
                            <TableCell
                              className={
                                expiring ? "text-amber-600 font-semibold" : ""
                              }
                            >
                              {formatDate(b.expiresAt)}
                              {dleft !== null && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({dleft}d)
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="tabular-nums">
                              {b.quantity.toFixed(2)} / {b.initialQuantity.toFixed(2)}{" "}
                              {ing.baseUnit}
                            </TableCell>
                            <TableCell>
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
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </main>
  );
}
