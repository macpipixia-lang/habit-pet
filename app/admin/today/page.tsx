import { AdminTodayClient } from "@/app/admin/today/today-client";
import { AdminNoticeCard } from "@/app/admin/_components/admin-client";
import { AdminShell } from "@/components/admin-shell";
import { Card, Pill } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { getAdminTodayAuditState } from "@/lib/data";
import { formatText, zhCN } from "@/lib/i18n/zhCN";

export default async function AdminTodayAuditPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = (await searchParams) ?? {};
  const userQuery = typeof params.user === "string" ? params.user.trim() : "";
  const state = await getAdminTodayAuditState(userQuery);
  const error = typeof params.error === "string" ? params.error : null;
  const success = typeof params.success === "string" ? params.success : null;
  const initialNotice = error
    ? { type: "error" as const, text: error }
    : success
      ? { type: "success" as const, text: zhCN.feedback.taskAuditUpdated }
      : null;

  return (
    <AdminShell activePath="/admin/today" title={zhCN.admin.todayAuditTitle} description={zhCN.admin.todayAuditDescription}>
      {!state.targetUser ? <AdminNoticeCard notice={initialNotice} /> : null}
      <Card>
        <Pill className="text-accent">{zhCN.admin.todayAuditBadge}</Pill>
        <h2 className="mt-4 text-2xl font-semibold text-ink">{zhCN.admin.todayAuditLookupTitle}</h2>
        <p className="mt-3 text-sm leading-7 text-mist">
          {formatText(zhCN.admin.todayAuditDateHint, { date: state.dateKey })}
        </p>
        <form className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input name="user" defaultValue={userQuery} placeholder={zhCN.admin.todayAuditUserPlaceholder} className="w-full rounded-2xl border border-line bg-panelAlt/70 px-4 py-3 text-ink" />
          <button className="rounded-2xl bg-accent px-4 py-3 font-semibold text-night transition hover:brightness-105">
            {zhCN.admin.filterButton}
          </button>
        </form>
      </Card>

      {userQuery && !state.targetUser ? (
        <Card>
          <p className="text-sm text-mist">{zhCN.admin.todayAuditUserNotFound}</p>
        </Card>
      ) : null}

      {state.targetUser ? <AdminTodayClient initialState={state} userQuery={userQuery} initialNotice={initialNotice} /> : null}
    </AdminShell>
  );
}
