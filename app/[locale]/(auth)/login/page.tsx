import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage() {
  const t = await getTranslations("auth");
  const tApp = await getTranslations("app");

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">{tApp("name")}</h1>
          <p className="text-sm text-muted-foreground">{t("login")}</p>
        </div>
        <LoginForm
          labels={{
            email: t("email"),
            password: t("password"),
            submit: t("login"),
            googleSignIn: t("loginWithGoogle"),
            invalidCredentials: t("invalidCredentials"),
          }}
        />
        <p className="text-center text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <Link href="/register" className="font-medium text-foreground hover:underline">
            {t("register")}
          </Link>
        </p>
      </div>
    </main>
  );
}
