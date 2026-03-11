import { Card, Pill } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getDashboardState } from "@/lib/data";
import { EXP_PER_LEVEL, MAX_LEVEL } from "@/lib/constants";
import { formatText, zhCN } from "@/lib/i18n/zhCN";
import { formatNumber } from "@/lib/utils";

function getPetStage(level: number) {
  if (level >= 25) return zhCN.pet.stages.auroraGuardian;
  if (level >= 18) return zhCN.pet.stages.moonlitCompanion;
  if (level >= 10) return zhCN.pet.stages.cloudHopper;
  if (level >= 4) return zhCN.pet.stages.sproutCub;
  return zhCN.pet.stages.tinyEgg;
}

export default async function PetPage() {
  const user = await requireUser();
  const state = await getDashboardState(user.id);
  const profile = state.user.profile!;
  const progress = profile.level >= MAX_LEVEL ? 100 : Math.round(((profile.exp % EXP_PER_LEVEL) / EXP_PER_LEVEL) * 100);

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="overflow-hidden p-0">
        <div className="border-b border-line bg-gradient-to-br from-sky-400/20 via-cyan-300/8 to-transparent px-6 py-6">
          <Pill className="text-accent">{zhCN.pet.panelBadge}</Pill>
          <p className="mt-4 text-sm uppercase tracking-[0.2em] text-mist">{getPetStage(profile.level)}</p>
          <h1 className="mt-2 text-4xl font-semibold text-white">{formatText(zhCN.pet.levelTitle, { level: profile.level })}</h1>
          <p className="mt-3 text-sm leading-7 text-mist">{formatText(zhCN.pet.levelDescription, { maxLevel: MAX_LEVEL })}</p>
        </div>
        <div className="px-6 py-6">
          <div className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.3),_transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-8 text-center">
            <div className="mx-auto h-44 w-44 rounded-full border border-white/10 bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.35),transparent_30%),radial-gradient(circle_at_50%_70%,rgba(14,165,233,0.28),transparent_45%),#0f172a] shadow-glow" />
            <p className="mt-6 text-lg text-white">{getPetStage(profile.level)}</p>
            <p className="mt-2 text-sm text-mist">{formatText(zhCN.pet.absorbed, { exp: formatNumber(profile.exp) })}</p>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <Card>
          <Pill className="text-accentWarm">{zhCN.pet.progressBadge}</Pill>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-mist">{zhCN.pet.exp}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{formatNumber(profile.exp)}</p>
            </div>
            <div>
              <p className="text-sm text-mist">{zhCN.pet.points}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{formatNumber(profile.points)}</p>
            </div>
            <div>
              <p className="text-sm text-mist">{zhCN.pet.streak}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{profile.streak}</p>
            </div>
          </div>
          <div className="mt-6 h-3 rounded-full bg-white/10">
            <div className="h-3 rounded-full bg-accent" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-3 text-sm text-mist">
            {profile.level >= MAX_LEVEL
              ? zhCN.pet.maxLevelReached
              : formatText(zhCN.pet.nextLevel, { current: profile.exp % EXP_PER_LEVEL, total: EXP_PER_LEVEL })}
          </p>
        </Card>

        <Card>
          <Pill className="text-accent">{zhCN.pet.milestoneBadge}</Pill>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[1, 5, 10, 20, 30].map((milestone) => (
              <div key={milestone} className="rounded-2xl border border-line bg-black/20 p-4">
                <p className="text-sm text-mist">{formatText(zhCN.pet.milestoneLevel, { level: milestone })}</p>
                <p className="mt-2 text-base text-white">
                  {profile.level >= milestone ? zhCN.pet.milestoneReached : zhCN.pet.milestoneLocked}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
