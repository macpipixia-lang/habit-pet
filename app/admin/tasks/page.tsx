import { saveTaskDefinitionAction } from "@/app/actions";
import { AdminFeedback } from "@/app/admin/_components/admin-feedback";
import { getAdminPageParams } from "@/app/admin/_lib";
import { AdminShell } from "@/components/admin-shell";
import { Card, Pill } from "@/components/ui";
import { getAdminSuccessMessage } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import { getAdminTasks } from "@/lib/data";
import { zhCN } from "@/lib/i18n/zhCN";

export default async function AdminTasksPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const { error, success } = await getAdminPageParams(searchParams);
  const successMessage = getAdminSuccessMessage(success);
  const tasks = await getAdminTasks();
  const taskOptions = tasks.map((task) => ({
    value: task.slug,
    label: `${task.slug} · ${task.nameZh}`,
  }));

  return (
    <AdminShell activePath="/admin/tasks" title={zhCN.admin.tasksTitle} description={zhCN.admin.tasksDescription}>
      <AdminFeedback error={error} successMessage={successMessage} />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <Pill className="text-accent">{zhCN.admin.createTaskTitle}</Pill>
          <h2 className="mt-4 text-2xl font-semibold text-white">{zhCN.admin.createTaskTitle}</h2>
          <p className="mt-3 text-sm leading-7 text-mist">{zhCN.admin.tasksDescription}</p>
          <form action={saveTaskDefinitionAction} className="mt-6 space-y-4">
            <input type="hidden" name="redirectTo" value="/admin/tasks" />
            <div className="space-y-2">
              <label className="text-sm text-mist" htmlFor="task-slug">
                {zhCN.admin.slugLabel}
              </label>
              <input id="task-slug" name="slug" className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-mist" htmlFor="task-nameZh">
                {zhCN.admin.nameLabel}
              </label>
              <input id="task-nameZh" name="nameZh" className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-mist" htmlFor="task-descriptionZh">
                {zhCN.admin.descriptionLabel}
              </label>
              <textarea
                id="task-descriptionZh"
                name="descriptionZh"
                className="min-h-28 w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-mist" htmlFor="task-exp">
                  {zhCN.admin.expLabel}
                </label>
                <input id="task-exp" name="exp" type="number" min="0" className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-mist" htmlFor="task-points">
                  {zhCN.admin.pointsLabel}
                </label>
                <input id="task-points" name="points" type="number" min="0" className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white" required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm text-mist" htmlFor="task-unlockLevel">
                  {zhCN.admin.unlockLevelLabel}
                </label>
                <input
                  id="task-unlockLevel"
                  name="unlockLevel"
                  type="number"
                  min="1"
                  defaultValue={1}
                  className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm text-mist" htmlFor="task-unlockAfterTaskSlug">
                  {zhCN.admin.unlockAfterTaskSlugLabel}
                </label>
                <select
                  id="task-unlockAfterTaskSlug"
                  name="unlockAfterTaskSlug"
                  className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
                  defaultValue=""
                >
                  <option value="">{zhCN.admin.unlockAfterTaskSlugHint}</option>
                  {taskOptions.map((task) => (
                    <option key={task.value} value={task.value}>
                      {task.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-mist" htmlFor="task-create-isActive">
                {zhCN.admin.activeLabel}
              </label>
              <select
                id="task-create-isActive"
                name="isActive"
                defaultValue="true"
                className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
              >
                <option value="true">{zhCN.admin.activeOption}</option>
                <option value="false">{zhCN.admin.inactiveOption}</option>
              </select>
            </div>
            <button className="w-full rounded-2xl bg-accent px-4 py-3 font-semibold text-slate-950">
              {zhCN.admin.saveTaskButton}
            </button>
          </form>
        </Card>

        <Card>
          <Pill className="text-accentWarm">{zhCN.admin.tasksBadge}</Pill>
          <h2 className="mt-4 text-2xl font-semibold text-white">{zhCN.admin.tasksTitle}</h2>
          <div className="mt-6 space-y-3">
            {tasks.length === 0 ? (
              <p className="text-sm text-mist">{zhCN.admin.emptyTasks}</p>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="rounded-2xl border border-line bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">{task.nameZh}</p>
                      <p className="mt-1 text-sm text-mist">{task.slug}</p>
                    </div>
                    <Pill>{task.isActive ? zhCN.admin.activeOption : zhCN.admin.inactiveOption}</Pill>
                  </div>
                  <p className="mt-3 text-sm text-mist">{task.descriptionZh}</p>
                  <form action={saveTaskDefinitionAction} className="mt-4 space-y-4">
                    <input type="hidden" name="id" value={task.id} />
                    <input type="hidden" name="redirectTo" value="/admin/tasks" />
                    <div className="space-y-2">
                      <label className="text-sm text-mist" htmlFor={`task-slug-${task.id}`}>
                        {zhCN.admin.slugLabel}
                      </label>
                      <input
                        id={`task-slug-${task.id}`}
                        name="slug"
                        defaultValue={task.slug}
                        className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-mist" htmlFor={`task-nameZh-${task.id}`}>
                        {zhCN.admin.nameLabel}
                      </label>
                      <input
                        id={`task-nameZh-${task.id}`}
                        name="nameZh"
                        defaultValue={task.nameZh}
                        className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-mist" htmlFor={`task-descriptionZh-${task.id}`}>
                        {zhCN.admin.descriptionLabel}
                      </label>
                      <textarea
                        id={`task-descriptionZh-${task.id}`}
                        name="descriptionZh"
                        defaultValue={task.descriptionZh}
                        className="min-h-24 w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
                        required
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm text-mist" htmlFor={`task-exp-${task.id}`}>
                          {zhCN.admin.expLabel}
                        </label>
                        <input
                          id={`task-exp-${task.id}`}
                          name="exp"
                          type="number"
                          min="0"
                          defaultValue={task.exp}
                          className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-mist" htmlFor={`task-points-${task.id}`}>
                          {zhCN.admin.pointsLabel}
                        </label>
                        <input
                          id={`task-points-${task.id}`}
                          name="points"
                          type="number"
                          min="0"
                          defaultValue={task.points}
                          className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <label className="text-sm text-mist" htmlFor={`task-unlockLevel-${task.id}`}>
                          {zhCN.admin.unlockLevelLabel}
                        </label>
                        <input
                          id={`task-unlockLevel-${task.id}`}
                          name="unlockLevel"
                          type="number"
                          min="1"
                          defaultValue={task.unlockLevel}
                          className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
                          required
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-sm text-mist" htmlFor={`task-unlockAfterTaskSlug-${task.id}`}>
                          {zhCN.admin.unlockAfterTaskSlugLabel}
                        </label>
                        <select
                          id={`task-unlockAfterTaskSlug-${task.id}`}
                          name="unlockAfterTaskSlug"
                          defaultValue={task.unlockAfterTaskSlug ?? ""}
                          className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
                        >
                          <option value="">{zhCN.admin.unlockAfterTaskSlugHint}</option>
                          {taskOptions
                            .filter((option) => option.value !== task.slug)
                            .map((option) => (
                              <option key={`${task.id}-${option.value}`} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-mist" htmlFor={`task-isActive-${task.id}`}>
                        {zhCN.admin.activeLabel}
                      </label>
                      <select
                        id={`task-isActive-${task.id}`}
                        name="isActive"
                        defaultValue={String(task.isActive)}
                        className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
                      >
                        <option value="true">{zhCN.admin.activeOption}</option>
                        <option value="false">{zhCN.admin.inactiveOption}</option>
                      </select>
                    </div>
                    <button className="rounded-2xl bg-accent px-4 py-3 font-semibold text-slate-950">
                      {zhCN.admin.updateTaskButton}
                    </button>
                  </form>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}

