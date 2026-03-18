"use client";

import { useState } from "react";
import Link from "next/link";
import { useMakeupCardAction } from "@/app/actions";
import { Card, Pill } from "@/components/ui";
import { LEVEL_EXP_THRESHOLDS, MAX_LEVEL } from "@/lib/constants";
import { formatText, zhCN } from "@/lib/i18n/zhCN";
import { formatNumber } from "@/lib/utils";

type TodayTask = {
  id: string;
  slug: string;
  nameZh: string;
  descriptionZh: string;
  exp: number;
  points: number;
  completed: boolean;
};

type LockedTask = {
  slug: string;
  nameZh: string;
  unlockHint: string;
};

type ProfileSummary = {
  streak: number;
  level: number;
  exp: number;
  points: number;
};

type TodayClientProps = {
  initialTasks: TodayTask[];
  lockedTasks: LockedTask[];
  initialProfile: ProfileSummary;
  nextShopPrice: number;
  showMakeupPrompt: boolean;
  initialError: string | null;
  initialSuccess: string | null;
  petSummary?: {
    name: string;
    speciesName: string;
    stageName: string;
    xp: number;
    progressPercent: number;
    coverImageUrl: string;
    stageLabel: string;
    skinName: string;
    mode3dHref?: string | null;
  } | null;
};

function getLevelFromExp(exp: number) {
  const safeExp = Math.max(0, exp);

  for (let index = LEVEL_EXP_THRESHOLDS.length - 1; index >= 0; index -= 1) {
    if (safeExp >= LEVEL_EXP_THRESHOLDS[index]) {
      return index + 1;
    }
  }

  return 1;
}

function getExpRequiredForLevel(level: number) {
  if (level < 1 || level > MAX_LEVEL) {
    return 0;
  }

  if (level === MAX_LEVEL) {
    return 0;
  }

  return LEVEL_EXP_THRESHOLDS[level] - LEVEL_EXP_THRESHOLDS[level - 1];
}

function getExpIntoCurrentLevel(exp: number) {
  const level = getLevelFromExp(exp);

  if (level >= MAX_LEVEL) {
    return getExpRequiredForLevel(MAX_LEVEL - 1);
  }

  return Math.max(0, exp) - LEVEL_EXP_THRESHOLDS[level - 1];
}

export function TodayClient({
  initialTasks,
  lockedTasks,
  initialProfile,
  nextShopPrice,
  showMakeupPrompt,
  initialError,
  initialSuccess,
  petSummary,
}: TodayClientProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [profile, setProfile] = useState(initialProfile);
  const [pendingTaskSlug, setPendingTaskSlug] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(
    initialError
      ? { type: "error", text: initialError }
      : initialSuccess
        ? { type: "success", text: initialSuccess }
        : null,
  );

  const expIntoLevel = getExpIntoCurrentLevel(profile.exp);
  const levelSpan = profile.level >= MAX_LEVEL ? expIntoLevel : getExpRequiredForLevel(profile.level);
  const progressPercent = Math.min(100, Math.round((expIntoLevel / Math.max(levelSpan, 1)) * 100));
  const completedTasks = tasks.filter((task) => task.completed);
  const rewardExp = completedTasks.reduce((sum, task) => sum + task.exp, 0);
  const rewardPoints = completedTasks.reduce((sum, task) => sum + task.points, 0);

  async function handleComplete(taskSlug: string) {
    if (pendingTaskSlug) {
      return;
    }

    const previousTasks = tasks;
    setPendingTaskSlug(taskSlug);
    setMessage(null);
    setTasks((current) =>
      current.map((task) => (task.slug === taskSlug ? { ...task, completed: true } : task)),
    );

    try {
      const response = await fetch("/api/today/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ taskSlug }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        profileSummary?: ProfileSummary;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || zhCN.today.completeFailed);
      }

      if (payload.profileSummary) {
        setProfile(payload.profileSummary);
      }

      setMessage({
        type: "success",
        text: zhCN.feedback.taskCompleted,
      });
    } catch (error) {
      setTasks(previousTasks);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : zhCN.today.completeFailed,
      });
    } finally {
      setPendingTaskSlug(null);
    }
  }

  return (
    <div className="space-y-6">
      {message ? (
        <Card
          className={
            message.type === "error"
              ? "border-danger/40 bg-danger/10 text-sm text-red-100"
              : "border-success/40 bg-emerald-500/10 text-sm text-emerald-100"
          }
        >
          {message.text}
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
          <p className="mt-2 text-sm text-mist">{formatText(zhCN.today.pointsHint, { price: nextShopPrice })}</p>
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
            {tasks.map((task) => {
              const isPending = pendingTaskSlug === task.slug;

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
                  <button
                    type="button"
                    disabled={task.completed || Boolean(pendingTaskSlug)}
                    onClick={() => void handleComplete(task.slug)}
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      task.completed
                        ? "cursor-not-allowed border border-line bg-white/5 text-mist"
                        : "bg-accent text-slate-950 hover:brightness-110"
                    }`}
                  >
                    {isPending ? zhCN.today.completingButton : task.completed ? zhCN.today.completedButton : zhCN.today.completeButton}
                  </button>
                </div>
              );
            })}
            {lockedTasks.length > 0 ? (
              <details className="rounded-2xl border border-line bg-black/10 p-4">
                <summary className="cursor-pointer list-none text-sm font-medium text-mist">
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden="true">🔒</span>
                    {formatText(zhCN.today.lockedSectionTitle, { count: lockedTasks.length })}
                  </span>
                </summary>
                <div className="mt-4 space-y-3">
                  {lockedTasks.map((task) => (
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
          {petSummary ? (
            <Card className="overflow-hidden p-0">
              <div className="border-b border-line bg-gradient-to-br from-cyan-400/15 via-sky-300/10 to-transparent px-6 py-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Pill className="text-accentWarm">{zhCN.pet.activeBadge}</Pill>
                    <h2 className="mt-4 text-2xl font-semibold text-white">{petSummary.name}</h2>
                    <p className="mt-2 text-sm text-mist">{petSummary.speciesName}</p>
                  </div>
                  {petSummary.mode3dHref ? (
                    <Link href={petSummary.mode3dHref} className="rounded-full border border-line px-4 py-2 text-sm text-white transition hover:border-white/30">
                      {zhCN.pet.mode3dEntry}
                    </Link>
                  ) : null}
                </div>
              </div>
              <div className="space-y-4 px-6 py-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={petSummary.coverImageUrl} alt={petSummary.stageName} className="h-48 w-full rounded-3xl object-cover" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-mist">{zhCN.pet.stageLabel}</p>
                    <p className="mt-2 text-lg text-white">{petSummary.stageName}</p>
                    <p className="mt-1 text-xs text-mist">{petSummary.stageLabel}</p>
                  </div>
                  <div>
                    <p className="text-sm text-mist">{zhCN.pet.skinLabel}</p>
                    <p className="mt-2 text-lg text-white">{petSummary.skinName}</p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between gap-3 text-sm text-mist">
                    <span>{zhCN.pet.exp}</span>
                    <span>{formatNumber(petSummary.xp)} XP</span>
                  </div>
                  <div className="mt-3 h-3 rounded-full bg-white/10">
                    <div className="h-3 rounded-full bg-accent" style={{ width: `${petSummary.progressPercent}%` }} />
                  </div>
                </div>
              </div>
            </Card>
          ) : null}

          <Card>
            <Pill className="text-accentWarm">{zhCN.today.rewardBadge}</Pill>
            <p className="mt-4 text-3xl font-semibold text-white">
              {formatText(zhCN.today.rewardExp, {
                exp: rewardExp,
              })}
            </p>
            <p className="mt-2 text-sm text-mist">
              {formatText(zhCN.today.rewardPoints, {
                points: rewardPoints,
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
  );
}
