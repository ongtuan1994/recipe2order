import { Suspense } from "react";
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
import {
  getSalesTodayStat,
  getLowStockStat,
  getExpiringSoonStat,
  getSaleRecipesCount,
} from "@/lib/actions/dashboard";

function daysUntil(d: Date): number {
  return Math.floor((d.getTime() - Date.now()) / 86400_000);
}

export default async function DashboardPage() {
  const t = await getTranslations("nav");

  return (
    <main className="flex-1 p-6 pb-20 md:pb-6 space-y-6">
      <h1 className="text-2xl font-semibold">{t("dashboard")}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Suspense fallback={<StatCardSkeleton />}>
          <SalesTodayCard />
        </Suspense>
        <Suspense fallback={<StatCardSkeleton />}>
          <LowStockCountCard />
        </Suspense>
        <Suspense fallback={<StatCardSkeleton />}>
          <ExpiringSoonCountCard />
        </Suspense>
        <Suspense fallback={<StatCardSkeleton />}>
          <RecipesCountCard />
        </Suspense>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Suspense fallback={<DetailCardSkeleton />}>
          <LowStockListCard />
        </Suspense>
        <Suspense fallback={<DetailCardSkeleton />}>
          <ExpiringSoonListCard />
        </Suspense>
      </div>
    </main>
  );
}

// ----- Stat cards -----

async function SalesTodayCard() {
  const [tSale, stat] = await Promise.all([
    getTranslations("sale"),
    getSalesTodayStat(),
  ]);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {tSale("title")} (today)
        </CardTitle>
        <ReceiptText className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tabular-nums">
          ฿{stat.total.toFixed(0)}
        </p>
        <p className="text-xs text-muted-foreground">{stat.count} sales</p>
      </CardContent>
    </Card>
  );
}

async function LowStockCountCard() {
  const [tStock, items] = await Promise.all([
    getTranslations("stock"),
    getLowStockStat(),
  ]);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {tStock("lowStock")}
        </CardTitle>
        <AlertTriangle className="h-4 w-4 text-amber-600" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tabular-nums">{items.length}</p>
        <p className="text-xs text-muted-foreground">ingredients</p>
      </CardContent>
    </Card>
  );
}

async function ExpiringSoonCountCard() {
  const [tStock, batches] = await Promise.all([
    getTranslations("stock"),
    getExpiringSoonStat(),
  ]);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {tStock("expiringSoon")}
        </CardTitle>
        <Clock className="h-4 w-4 text-amber-600" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tabular-nums">{batches.length}</p>
        <p className="text-xs text-muted-foreground">batches (≤ 3 days)</p>
      </CardContent>
    </Card>
  );
}

async function RecipesCountCard() {
  const [t, count] = await Promise.all([
    getTranslations("nav"),
    getSaleRecipesCount(),
  ]);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {t("recipes")}
        </CardTitle>
        <ChefHat className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tabular-nums">{count}</p>
        <p className="text-xs text-muted-foreground">sale recipes</p>
      </CardContent>
    </Card>
  );
}

// ----- Detail cards -----

async function LowStockListCard() {
  const [tStock, items] = await Promise.all([
    getTranslations("stock"),
    getLowStockStat(),
  ]);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{tStock("lowStock")}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">All good.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {items.slice(0, 10).map((i) => (
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
  );
}

async function ExpiringSoonListCard() {
  const [tStock, batches] = await Promise.all([
    getTranslations("stock"),
    getExpiringSoonStat(),
  ]);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{tStock("expiringSoon")}</CardTitle>
      </CardHeader>
      <CardContent>
        {batches.length === 0 ? (
          <p className="text-sm text-muted-foreground">All good.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {batches.slice(0, 10).map((b) => {
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
  );
}

// ----- Skeletons -----

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="h-7 w-20 rounded bg-muted animate-pulse" />
        <div className="h-3 w-16 rounded bg-muted animate-pulse" />
      </CardContent>
    </Card>
  );
}

function DetailCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-5 w-32 rounded bg-muted animate-pulse" />
      </CardHeader>
      <CardContent className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-4 w-full rounded bg-muted animate-pulse" />
        ))}
      </CardContent>
    </Card>
  );
}
