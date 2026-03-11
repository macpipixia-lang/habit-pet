import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { Card, Pill } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";

export default async function AuthPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/today");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <Pill className="text-accent">Login</Pill>
        <h1 className="mt-4 text-3xl font-semibold text-white">Welcome back</h1>
        <p className="mt-3 text-sm leading-7 text-mist">Use your username and password. Phone binding stays out of scope for MVP.</p>
        <div className="mt-6">
          <AuthForm mode="login" />
        </div>
      </Card>
      <Card>
        <Pill className="text-accentWarm">Register</Pill>
        <h2 className="mt-4 text-3xl font-semibold text-white">Create a new account</h2>
        <p className="mt-3 text-sm leading-7 text-mist">
          Accounts are backed by SQLite through Prisma so progress syncs across devices.
        </p>
        <div className="mt-6">
          <AuthForm mode="register" />
        </div>
      </Card>
    </div>
  );
}
