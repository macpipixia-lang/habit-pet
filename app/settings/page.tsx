import { logoutAction } from "@/app/actions";
import { Card, Pill } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatText, zhCN } from "@/lib/i18n/zhCN";

export default async function SettingsPage() {
  const user = await requireUser();
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <Pill className="text-accent">{zhCN.settings.accountBadge}</Pill>
        <h1 className="mt-4 text-3xl font-semibold text-white">{zhCN.settings.title}</h1>
        <div className="mt-6 rounded-2xl border border-line bg-black/20 p-4">
          <p className="text-sm text-mist">{zhCN.settings.username}</p>
          <p className="mt-2 text-lg text-white">{user.username}</p>
        </div>
        <form action={logoutAction} className="mt-6">
          <button className="rounded-2xl border border-line px-4 py-3 text-white">{zhCN.settings.logout}</button>
        </form>
      </Card>

      <Card>
        <Pill className="text-accentWarm">{zhCN.settings.developmentBadge}</Pill>
        <h2 className="mt-4 text-3xl font-semibold text-white">{zhCN.settings.debugTitle}</h2>
        <p className="mt-3 text-sm leading-7 text-mist">{zhCN.settings.debugDescription}</p>
        <div className="mt-6 rounded-2xl border border-line bg-black/20 p-4 text-sm text-mist">
          <p>{formatText(zhCN.settings.environment, { env: process.env.NODE_ENV ?? "" })}</p>
          <p className="mt-2">
            {formatText(zhCN.settings.endpoint, {
              value: isDevelopment ? "/api/debug/reset" : zhCN.settings.endpointDisabled,
            })}
          </p>
        </div>
        {isDevelopment ? (
          <form action="/api/debug/reset" method="post" className="mt-6">
            <button className="rounded-2xl border border-line px-4 py-3 text-white">{zhCN.settings.resetButton}</button>
          </form>
        ) : null}
      </Card>
    </div>
  );
}
