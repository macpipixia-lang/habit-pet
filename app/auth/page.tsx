import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { Card, Pill } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { hasAnyUserPet } from "@/lib/data";
import { zhCN } from "@/lib/i18n/zhCN";

export default async function AuthPage() {
  const user = await getCurrentUser();

  if (user) {
    const hasPets = await hasAnyUserPet(user.id);
    redirect(hasPets ? "/dashboard" : "/onboarding/pet-egg");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <Pill className="text-accent">{zhCN.auth.loginBadge}</Pill>
        <h1 className="mt-4 text-3xl font-semibold text-ink">{zhCN.auth.loginTitle}</h1>
        <p className="mt-3 text-sm leading-7 text-mist">{zhCN.auth.loginDescription}</p>
        <div className="mt-6">
          <AuthForm mode="login" />
        </div>
      </Card>
      <Card>
        <Pill className="text-accentWarm">{zhCN.auth.registerBadge}</Pill>
        <h2 className="mt-4 text-3xl font-semibold text-ink">{zhCN.auth.registerTitle}</h2>
        <p className="mt-3 text-sm leading-7 text-mist">{zhCN.auth.registerDescription}</p>
        <div className="mt-6">
          <AuthForm mode="register" />
        </div>
      </Card>
    </div>
  );
}
