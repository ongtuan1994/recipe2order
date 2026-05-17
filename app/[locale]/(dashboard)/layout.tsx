import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { redirect } from "@/i18n/navigation";
import {
  ChefHat,
  Beaker,
  Carrot,
  Boxes,
  Gauge,
  ReceiptText,
  ShoppingCart,
  LayoutDashboard,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { getOptionalUser } from "@/lib/auth-helpers";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, key: "dashboard" },
  { href: "/recipes", icon: ChefHat, key: "recipes" },
  { href: "/prep-recipes", icon: Beaker, key: "prepRecipes" },
  { href: "/ingredients", icon: Carrot, key: "ingredients" },
  { href: "/stock", icon: Boxes, key: "stock" },
  { href: "/capacity", icon: Gauge, key: "capacity" },
  { href: "/sales", icon: ReceiptText, key: "sales" },
  { href: "/purchase-plans", icon: ShoppingCart, key: "purchasePlans" },
] as const;

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getOptionalUser();
  if (!user) {
    redirect({ href: "/login", locale });
  }

  const t = await getTranslations("nav");
  const tApp = await getTranslations("app");
  const tAuth = await getTranslations("auth");

  return (
    <div className="flex flex-1 min-h-screen">
      <aside className="hidden md:flex w-60 flex-col border-r bg-card px-4 py-6 gap-1">
        <div className="px-2 pb-4">
          <p className="text-sm font-semibold">{tApp("name")}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map(({ href, icon: Icon, key }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Icon className="h-4 w-4" />
              {t(key)}
            </Link>
          ))}
        </nav>
        <div className="border-t pt-3 mt-3 space-y-1">
          <p className="px-3 text-xs text-muted-foreground truncate" title={user!.email ?? ""}>
            {user!.email}
          </p>
          <LogoutButton label={tAuth("logout")} />
        </div>
      </aside>
      <div className="flex flex-1 flex-col">{children}</div>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 grid grid-cols-4 border-t bg-card">
        {NAV_ITEMS.slice(0, 4).map(({ href, icon: Icon, key }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1 py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Icon className="h-5 w-5" />
            {t(key)}
          </Link>
        ))}
      </nav>
    </div>
  );
}
