import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Plus, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listSales } from "@/lib/actions/sale";

export default async function SalesPage() {
  const [t, sales] = await Promise.all([
    getTranslations("sale"),
    listSales(),
  ]);

  return (
    <main className="flex-1 p-6 pb-20 md:pb-6 space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <Button asChild className="gap-1">
          <Link href="/sales/new">
            <Plus className="h-4 w-4" /> {t("new")}
          </Link>
        </Button>
      </div>

      {sales.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <ReceiptText className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">{t("emptyList")}</p>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sale #</TableHead>
                  <TableHead>{t("soldAt")}</TableHead>
                  <TableHead>{t("items")}</TableHead>
                  <TableHead>{t("totalAmount")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.saleNo}</TableCell>
                    <TableCell className="tabular-nums">
                      {s.saleDate.toISOString().slice(0, 16).replace("T", " ")}
                    </TableCell>
                    <TableCell>
                      {s.items
                        .map((i) => `${i.recipe.name} ${i.recipeSize.sizeName} × ${i.quantity}`)
                        .join(", ")}
                    </TableCell>
                    <TableCell className="tabular-nums font-semibold">
                      ฿{s.totalAmount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
