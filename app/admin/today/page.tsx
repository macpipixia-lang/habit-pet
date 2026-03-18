import { AdminFeedback } from "@/app/admin/_components/admin-feedback";
import { getAdminPageParams } from "@/app/admin/_lib";
import { adminCompleteDailyTaskAction, adminRevertDailyTaskAction } from "@/app/actions";
import { AdminShell } from "@/components/admin-shell";
import { Card, Pill } from "@/components/ui";
import { getAdminSuccessMessage } from "@/lib/admin";
import { getAdminTodayAuditState } from "@/lib/data";
import { requireAdmin } from "@/lib/auth";
import { formatText, zhCN } from "@/lib/i18n/zhCN";
import { formatNumber } from "@/lib/utils";

export default async function AdminTodayAuditPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const { error, success } = await getAdminPageParams(searchParams);
  const params = (await searchParams) ?? {};
  const userQuery = typeof params.user === "string" ? params.user.trim() : "";
  const successMessage = getAdminSuccessMessage(success);
  const state = await getAdminTodayAuditState(userQuery);

  return (
    <AdminShell activePath="/admin/today" title={zhCN.admin.todayAuditTitle} description={zhCN.admin.todayAuditDescription}>
      <AdminFeedback error={error} successMessage={successMessage} />

      <Card>
        <Pill className="text-accent">{zhCN.admin.todayAuditBadge}</Pill>
        <h2 className="mt-4 text-2xl font-semibold text-white">{zhCN.admin.todayAuditLookupTitle}</h2>
        <p className="mt-3 text-sm leading-7 text-mist">
          {formatText(zhCN.admin.todayAuditDateHint, { date: state.dateKey })}
        </p>
        <form action="/admin/today" className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input
            name="user"
            defaultValue={userQuery}
            placeholder={zhCN.admin.todayAuditUserPlaceholder}
            className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
          />
          <button className="rounded-2xl bg-accent px-4 py-3 font-semibold text-slate-950">
            {zhCN.admin.filterButton}
          </button>
        </form>
      </Card>

      {userQuery && !state.targetUser ? (
        <Card>
          <p className="text-sm text-mist">{zhCN.admin.todayAuditUserNotFound}</p>
        </Card>
      ) : null}

      {state.targetUser ? (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Pill className="text-accentWarm">{zhCN.admin.todayAuditTargetBadge}</Pill>
              <h2 className="mt-4 text-2xl font-semibold text-white">{state.targetUser.username}</h2>
              <p className="mt-2 text-sm text-mist">{formatText(zhCN.admin.todayAuditUserId, { id: state.targetUser.id })}</p>
            </div>
            {state.targetUser.profile ? (
              <div className="text-right">
                <p className="text-sm text-mist">{zhCN.admin.todayAuditUserSummary}</p>
                <p className="mt-2 text-white">
                  {formatText(zhCN.admin.todayAuditUserStats, {
                    points: formatNumber(state.targetUser.profile.points),
                    exp: formatNumber(state.targetUser.profile.exp),
                    streak: state.targetUser.profile.streak,
                  })}
                </p>
              </div>
            ) : null}
          </div>

          <div className="mt-6 space-y-4">
            {state.tasks.map((task) => (
              <div key={task.slug} className="rounded-2xl border border-line bg-black/20 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-white">{task.nameZh}</span>
                      <Pill>+{task.exp} EXP</Pill>
                      <Pill>{formatText(zhCN.today.taskPoints, { points: task.points })}</Pill>
                      <Pill className={task.completed ? "text-success" : "text-accentWarm"}>
                        {task.completed ? zhCN.admin.todayAuditCompleted : zhCN.admin.todayAuditPending}
                      </Pill>
                    </div>
                    <p className="mt-2 text-sm text-mist">{task.descriptionZh}</p>
                  </div>
                  <div className="flex gap-3">
                    <form action={adminCompleteDailyTaskAction}>
                      <input type="hidden" name="userQuery" value={userQuery} />
                      <input type="hidden" name="taskSlug" value={task.slug} />
                      <button
                        disabled={task.completed}
                        className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {zhCN.admin.todayAuditMarkComplete}
                      </button>
                    </form>
                    <form action={adminRevertDailyTaskAction}>
                      <input type="hidden" name="userQuery" value={userQuery} />
                      <input type="hidden" name="taskSlug" value={task.slug} />
                      <button
                        disabled={!task.completed}
                        className="rounded-2xl border border-line px-4 py-3 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {zhCN.admin.todayAuditRevert}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </AdminShell>
  );
}
