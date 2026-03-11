import { buyMakeupCardAction, saveTasksAction, settleTodayAction, useMakeupCardAction } from "@/app/actions";
import { Card, Pill } from "@/components/ui";
import { getDashboardState } from "@/lib/data";
import { requireUser } from "@/lib/auth";
import { EXP_PER_LEVEL, MAX_LEVEL } from "@/lib/constants";
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
  const isSettled = Boolean(state.todayLog.settledAt);
  const expIntoLevel = profile.level >= MAX_LEVEL ? EXP_PER_LEVEL : profile.exp % EXP_PER_LEVEL;
  const progressPercent = Math.min(100, Math.round((expIntoLevel / EXP_PER_LEVEL) * 100));
  const error = typeof params.error === "string" ? params.error : null;
  const success = typeof params.success === "string" ? params.success : null;

  return (
    <div className="space-y-6">
      {error ? (
        <Card className="border-danger/40 bg-danger/10 text-sm text-red-100">{error}</Card>
      ) : success ? (
        <Card className="border-success/40 bg-emerald-500/10 text-sm text-emerald-100">
          {success === "progress-saved"
            ? "Progress saved."
            : success === "settled"
              ? "Today settled."
              : "Makeup card applied."}
        </Card>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm text-mist">Current streak</p>
          <p className="mt-3 text-3xl font-semibold text-white">{profile.streak}</p>
          <p className="mt-2 text-sm text-mist">Miss a day and it resets. Makeup cards restore yesterday only.</p>
        </Card>
        <Card>
          <p className="text-sm text-mist">Level</p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {profile.level} / {MAX_LEVEL}
          </p>
          <div className="mt-3 h-2 rounded-full bg-white/10">
            <div className="h-2 rounded-full bg-accent" style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="mt-2 text-sm text-mist">
            {formatNumber(profile.exp)} total EXP. Level cap reached at {MAX_LEVEL}, EXP keeps accumulating.
          </p>
        </Card>
        <Card>
          <p className="text-sm text-mist">Points</p>
          <p className="mt-3 text-3xl font-semibold text-white">{formatNumber(profile.points)}</p>
          <p className="mt-2 text-sm text-mist">Next makeup card costs {state.nextShopPrice} points.</p>
        </Card>
        <Card>
          <p className="text-sm text-mist">Makeup cards</p>
          <p className="mt-3 text-3xl font-semibold text-white">{profile.makeupCards}</p>
          <p className="mt-2 text-sm text-mist">Use before settling today to repair yesterday.</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <Pill className="text-accent">Today</Pill>
              <h1 className="mt-4 text-3xl font-semibold text-white">Daily checklist</h1>
              <p className="mt-2 text-sm leading-7 text-mist">
                Tick any completed tasks, save progress freely, then settle once for the day.
              </p>
            </div>
            {isSettled ? <Pill className="text-success">Settled</Pill> : <Pill className="text-accentWarm">Open</Pill>}
          </div>

          <form className="mt-6 space-y-4">
            {state.tasks.map((task) => {
              const checked = state.todayCompletedTaskIds.includes(task.id);

              return (
                <label
                  key={task.id}
                  className="flex items-start gap-4 rounded-2xl border border-line bg-black/20 p-4 transition hover:border-white/20"
                >
                  <input
                    type="checkbox"
                    name="taskIds"
                    value={task.id}
                    defaultChecked={checked}
                    disabled={isSettled}
                    className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent text-accent focus:ring-accent"
                  />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-white">{task.title}</span>
                      <Pill>+{task.exp} EXP</Pill>
                      <Pill>+{task.points} pts</Pill>
                    </div>
                    <p className="mt-2 text-sm text-mist">{task.description}</p>
                  </div>
                </label>
              );
            })}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <button
                formAction={saveTasksAction}
                disabled={isSettled}
                className="rounded-2xl border border-line px-4 py-3 text-sm text-white transition hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Save progress
              </button>
              <button
                formAction={settleTodayAction}
                disabled={isSettled}
                className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Settle today
              </button>
            </div>
          </form>
        </Card>

        <div className="space-y-6">
          <Card>
            <Pill className="text-accentWarm">Projected reward</Pill>
            <p className="mt-4 text-3xl font-semibold text-white">+{state.tasks.filter((task) => state.todayCompletedTaskIds.includes(task.id)).reduce((sum, task) => sum + task.exp, 0)} EXP</p>
            <p className="mt-2 text-sm text-mist">+{state.tasks.filter((task) => state.todayCompletedTaskIds.includes(task.id)).reduce((sum, task) => sum + task.points, 0)} points if you settle now.</p>
          </Card>

          <Card>
            <Pill className="text-accent">Recovery</Pill>
            <h2 className="mt-4 text-xl font-semibold text-white">Use a makeup card</h2>
            <p className="mt-2 text-sm leading-7 text-mist">
              Yesterday only. This settles yesterday using its saved checklist and restores the streak if eligible.
            </p>
            <form action={useMakeupCardAction} className="mt-4">
              <button className="w-full rounded-2xl border border-line px-4 py-3 text-sm text-white transition hover:border-white/20">
                Use 1 makeup card
              </button>
            </form>
          </Card>

          <Card>
            <Pill className="text-accentWarm">Quick shop</Pill>
            <h2 className="mt-4 text-xl font-semibold text-white">Buy makeup card</h2>
            <p className="mt-2 text-sm leading-7 text-mist">
              Price grows linearly: base 50 + purchase count. Current price is {state.nextShopPrice} points.
            </p>
            <form action={buyMakeupCardAction} className="mt-4">
              <button className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110">
                Redeem for {state.nextShopPrice} points
              </button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
