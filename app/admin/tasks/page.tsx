import { AdminTasksClient } from "@/app/admin/tasks/tasks-client";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getAdminTasks } from "@/lib/data";
import { zhCN } from "@/lib/i18n/zhCN";

export default async function AdminTasksPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = (await searchParams) ?? {};
  const tasks = await getAdminTasks();
  const error = typeof params.error === "string" ? params.error : null;
  const success = typeof params.success === "string" ? params.success : null;
  const initialNotice = error
    ? { type: "error" as const, text: error }
    : success
      ? { type: "success" as const, text: zhCN.feedback.taskSaved }
      : null;

  return (
    <AdminShell activePath="/admin/tasks" title={zhCN.admin.tasksTitle} description={zhCN.admin.tasksDescription}>
      <AdminTasksClient initialTasks={tasks} initialNotice={initialNotice} />
    </AdminShell>
  );
}
