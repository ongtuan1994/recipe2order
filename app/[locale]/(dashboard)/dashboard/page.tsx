import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  AlertTriangle,
  Clock,
  ReceiptText,
  ChefHat,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDashboardSummary } from "@/lib/actions/dashboard";

function daysUntil(d: Date): number {
  return Math.floor((d.getTime() - Date.now()) / 86400_000);
}

export default async function DashboardPage() {
  const t = await getTranslations("nav");
  const tStock = await getTranslations("stock");
  const tSale = await getTranslations("sale");
  const s = await getDashboardSummary();

  return (
    <main className="flex-1 p-6 pb-20 md:pb-6 space-y-6">
      <h1 className="text-2xl font-semibold">{t("dashboard")}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {tSale("title")} (today)
            </CardTitle>
            <ReceiptText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              ฿{s.salesToday.total.toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">
              {s.salesToday.count} sales
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {tStock("lowStock")}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{s.lowStock.length}</p>
            <p className="text-xs text-muted-foreground">ingredients</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {tStock("expiringSoon")}
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{s.expiringSoon.length}</p>
            <p className="text-xs text-muted-foreground">batches (≤ 3 days)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("recipes")}
            </CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{s.totalRecipes}</p>
            <p className="text-xs text-muted-foreground">sale recipes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{tStock("lowStock")}</CardTitle>
          </CardHeader>
          <CardContent>
            {s.lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">All good.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {s.lowStock.slice(0, 10).map((i) => (
                  <li key={i.id} className="flex justify-between gap-3">
                    <Link
                      href={`/ingredients/${i.id}`}
                      className="hover:underline"
                    >
                      {i.name}
                    </Link>
                    <span className="tabular-nums text-amber-600">
                      {i.total.toFixed(2)} / {i.threshold} {i.baseUnit}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{tStock("expiringSoon")}</CardTitle>
          </CardHeader>
          <CardContent>
            {s.expiringSoon.length === 0 ? (
              <p className="text-sm text-muted-foreground">All good.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {s.expiringSoon.slice(0, 10).map((b) => {
                  const days = daysUntil(b.expiresAt);
                  return (
                    <li key={b.id} className="flex justify-between gap-3">
                      <span>{b.ingredientName}</span>
                      <span className="flex gap-2 items-center">
                        <span className="tabular-nums text-muted-foreground">
                          {b.quantity.toFixed(2)} {b.baseUnit}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            days <= 0
                              ? "border-red-500 text-red-700"
                              : "border-amber-500 text-amber-700"
                          }
                        >
                          {days <= 0 ? "today" : `${days}d`}
                        </Badge>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
