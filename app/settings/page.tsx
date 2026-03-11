import { logoutAction } from "@/app/actions";
import { Card, Pill } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export default async function SettingsPage() {
  const user = await requireUser();
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <Pill className="text-accent">Account</Pill>
        <h1 className="mt-4 text-3xl font-semibold text-white">Settings</h1>
        <div className="mt-6 rounded-2xl border border-line bg-black/20 p-4">
          <p className="text-sm text-mist">Username</p>
          <p className="mt-2 text-lg text-white">{user.username}</p>
        </div>
        <form action={logoutAction} className="mt-6">
          <button className="rounded-2xl border border-line px-4 py-3 text-white">Log out</button>
        </form>
      </Card>

      <Card>
        <Pill className="text-accentWarm">Development</Pill>
        <h2 className="mt-4 text-3xl font-semibold text-white">Debug tools</h2>
        <p className="mt-3 text-sm leading-7 text-mist">
          The reset API is available only in development and clears the current user profile, logs, and ledger.
        </p>
        <div className="mt-6 rounded-2xl border border-line bg-black/20 p-4 text-sm text-mist">
          <p>Environment: {process.env.NODE_ENV}</p>
          <p className="mt-2">Endpoint: {isDevelopment ? "/api/debug/reset" : "Disabled outside development"}</p>
        </div>
        {isDevelopment ? (
          <form action="/api/debug/reset" method="post" className="mt-6">
            <button className="rounded-2xl border border-line px-4 py-3 text-white">Reset current user data</button>
          </form>
        ) : null}
      </Card>
    </div>
  );
}
