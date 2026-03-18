import { completeDailyTaskAction, useMakeupCardAction } from "@/app/actions";
import { PetOnboardingGuard } from "@/components/pet-onboarding-guard";
import { Card, Pill } from "@/components/ui";
import { getDashboardState } from "@/lib/data";
import { requireUser } from "@/lib/auth";
import { MAX_LEVEL } from "@/lib/constants";
import { getExpIntoCurrentLevel, getExpRequiredForLevel } from "@/lib/game";
import { formatText, zhCN } from "@/lib/i18n/zhCN";
import { formatNumber } from "@/lib/utils";

export default async function TodayPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const state = await getDashboardState(user.id);
  const profile = state.user.profile!;
  const expIntoLevel = getExpIntoCurrentLevel(profile.exp);
  const levelSpan = profile.level >= MAX_LEVEL ? expIntoLevel : getExpRequiredForLevel(profile.level);
  const progressPercent = Math.min(100, Math.round((expIntoLevel / Math.max(levelSpan, 1)) * 100));
  const error = typeof params.error === "string" ? params.error : null;
  const success = typeof params.success === "string" ? params.success : null;
  const showMakeupPrompt = state.makeupPromptVisible;

  return (
    <PetOnboardingGuard>
      <div className="space-y-6">
      {error ? (
        <Card className="border-danger/40 bg-danger/10 text-sm text-red-100">{error}</Card>
      ) : success ? (
        <Card className="border-success/40 bg-emerald-500/10 text-sm text-emerald-100">
          {success === "task-completed" ? zhCN.feedback.taskCompleted : zhCN.feedback.makeupApplied}
        </Card>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <p className="text-sm text-mist">{zhCN.today.streak}</p>
          <p className="mt-3 text-3xl font-semibold text-white">{profile.streak}</p>
          <p className="mt-2 text-sm text-mist">{zhCN.today.streakHint}</p>
        </Card>
        <Card>
          <p className="text-sm text-mist">{zhCN.today.level}</p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {profile.level} / {MAX_LEVEL}
          </p>
          <div className="mt-3 h-2 rounded-full bg-white/10">
            <div className="h-2 rounded-full bg-accent" style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="mt-2 text-sm text-mist">
            {formatText(zhCN.today.levelHint, {
              exp: formatNumber(profile.exp),
              maxLevel: MAX_LEVEL,
            })}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-mist">{zhCN.today.points}</p>
          <p className="mt-3 text-3xl font-semibold text-white">{formatNumber(profile.points)}</p>
          <p className="mt-2 text-sm text-mist">{formatText(zhCN.today.pointsHint, { price: state.nextShopPrice })}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <Pill className="text-accent">{zhCN.today.badge}</Pill>
              <h1 className="mt-4 text-3xl font-semibold text-white">{zhCN.today.title}</h1>
              <p className="mt-2 text-sm leading-7 text-mist">{zhCN.today.description}</p>
            </div>
            <Pill className="text-accentWarm">{zhCN.today.statusRealtime}</Pill>
          </div>

          <div className="mt-6 space-y-4">
            {state.tasks.map((task) => {
              return (
                <div
                  key={task.id}
                  className="flex items-start gap-4 rounded-2xl border border-line bg-black/20 p-4 transition hover:border-white/20"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-white">{task.nameZh}</span>
                      <Pill>+{task.exp} EXP</Pill>
                      <Pill>{formatText(zhCN.today.taskPoints, { points: task.points })}</Pill>
                    </div>
                    <p className="mt-2 text-sm text-mist">{task.descriptionZh}</p>
                  </div>
                  <form action={completeDailyTaskAction}>
                    <input type="hidden" name="taskSlug" value={task.slug} />
                    <button
                      disabled={task.completed}
                      className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                        task.completed
                          ? "cursor-not-allowed border border-line bg-white/5 text-mist"
                          : "bg-accent text-slate-950 hover:brightness-110"
                      }`}
                    >
                      {task.completed ? zhCN.today.completedButton : zhCN.today.completeButton}
                    </button>
                  </form>
                </div>
              );
            })}
            {state.lockedTasks.length > 0 ? (
              <details className="rounded-2xl border border-line bg-black/10 p-4">
                <summary className="cursor-pointer list-none text-sm font-medium text-mist">
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden="true">🔒</span>
                    {formatText(zhCN.today.lockedSectionTitle, { count: state.lockedTasks.length })}
                  </span>
                </summary>
                <div className="mt-4 space-y-3">
                  {state.lockedTasks.map((task) => (
                    <div key={task.slug} className="rounded-2xl border border-line bg-black/20 p-4 opacity-80">
                      <div className="flex items-center gap-2">
                        <span aria-hidden="true">🔒</span>
                        <span className="font-medium text-white">{task.nameZh}</span>
                      </div>
                      <p className="mt-2 text-sm text-mist">{task.unlockHint}</p>
                    </div>
                  ))}
                </div>
              </details>
            ) : null}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <Pill className="text-accentWarm">{zhCN.today.rewardBadge}</Pill>
            <p className="mt-4 text-3xl font-semibold text-white">
              {formatText(zhCN.today.rewardExp, {
                exp: state.tasks.filter((task) => state.todayCompletedTaskIds.includes(task.id)).reduce((sum, task) => sum + task.exp, 0),
              })}
            </p>
            <p className="mt-2 text-sm text-mist">
              {formatText(zhCN.today.rewardPoints, {
                points: state.tasks.filter((task) => state.todayCompletedTaskIds.includes(task.id)).reduce((sum, task) => sum + task.points, 0),
              })}
            </p>
          </Card>

          {showMakeupPrompt ? (
            <Card>
              <Pill className="text-accentWarm">{zhCN.today.recoveryBadge}</Pill>
              <h2 className="mt-4 text-xl font-semibold text-white">{zhCN.today.makeupPromptTitle}</h2>
              <p className="mt-2 text-sm leading-7 text-mist">{zhCN.today.makeupPromptDescription}</p>
              <form action={useMakeupCardAction} className="mt-4">
                <button className="w-full rounded-2xl border border-line px-4 py-3 text-sm text-white transition hover:border-white/20">
                  {zhCN.today.recoveryButton}
                </button>
              </form>
            </Card>
          ) : null}
        </div>
      </div>
      </div>
    </PetOnboardingGuard>
  );
}
