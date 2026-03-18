"use client";

import { useState } from "react";
import { Card, Pill } from "@/components/ui";
import { formatText, zhCN } from "@/lib/i18n/zhCN";
import { formatNumber } from "@/lib/utils";
import { AdminNoticeCard, postAdminJson, useAdminNotice } from "@/app/admin/_components/admin-client";

type TodayTask = {
  slug: string;
  nameZh: string;
  descriptionZh: string;
  exp: number;
  points: number;
  completed: boolean;
};

type TodayAuditState = {
  dateKey: string;
  targetUser: {
    id: string;
    username: string;
    profile: {
      points: number;
      exp: number;
      streak: number;
    } | null;
  } | null;
  tasks: TodayTask[];
};

export function AdminTodayClient({
  initialState,
  userQuery,
  initialNotice,
}: {
  initialState: TodayAuditState;
  userQuery: string;
  initialNotice: { type: "error" | "success"; text: string } | null;
}) {
  const [state, setState] = useState(initialState);
  const [notice, setNotice] = useAdminNotice(initialNotice);
  const [pendingTask, setPendingTask] = useState<string | null>(null);

  async function handleAction(taskSlug: string, action: "complete" | "revert") {
    const previousState = state;
    setPendingTask(`${action}:${taskSlug}`);
    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) =>
        task.slug === taskSlug ? { ...task, completed: action === "complete" } : task,
      ),
    }));

    try {
      const result = await postAdminJson<TodayAuditState>(`/api/admin/today/${action}`, { userQuery, taskSlug });
      setState(result.data ?? previousState);
      setNotice({ type: "success", text: result.message ?? zhCN.feedback.taskAuditUpdated });
    } catch (error) {
      setState(previousState);
      setNotice({ type: "error", text: error instanceof Error ? error.message : zhCN.feedback.fallbackError });
    } finally {
      setPendingTask(null);
    }
  }

  if (!state.targetUser) {
    return <AdminNoticeCard notice={notice} />;
  }

  return (
    <div className="space-y-6">
      <AdminNoticeCard notice={notice} />
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
                  <button
                    disabled={task.completed || Boolean(pendingTask)}
                    onClick={() => void handleAction(task.slug, "complete")}
                    className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {pendingTask === `complete:${task.slug}` ? zhCN.auth.submitting : zhCN.admin.todayAuditMarkComplete}
                  </button>
                  <button
                    disabled={!task.completed || Boolean(pendingTask)}
                    onClick={() => void handleAction(task.slug, "revert")}
                    className="rounded-2xl border border-line px-4 py-3 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {pendingTask === `revert:${task.slug}` ? zhCN.auth.submitting : zhCN.admin.todayAuditRevert}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
