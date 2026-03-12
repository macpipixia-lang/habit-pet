import Link from "next/link";
import { applyPetSkinAction, setActivePetAction, updatePetNicknameAction } from "@/app/actions";
import { PetOnboardingGuard } from "@/components/pet-onboarding-guard";
import { Card, Pill } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getPetPageState } from "@/lib/data";
import { formatText, zhCN } from "@/lib/i18n/zhCN";
import { getPetVisual } from "@/lib/pets";
import { formatShanghaiDate } from "@/lib/time";
import { formatNumber } from "@/lib/utils";

export default async function PetPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const state = await getPetPageState(user.id);
  const error = typeof params.error === "string" ? params.error : null;
  const success = typeof params.success === "string" ? params.success : null;
  const successMessage =
    success === "pet-unlocked"
      ? zhCN.feedback.petUnlocked
      : success === "starter-pet-granted"
        ? zhCN.feedback.starterPetGranted
        : success === "starter-pet-exists"
          ? zhCN.feedback.starterPetExists
      : success === "active-pet-updated"
        ? zhCN.feedback.activePetUpdated
        : success === "pet-nickname-updated"
          ? zhCN.feedback.petNicknameUpdated
          : success === "pet-skin-updated"
            ? zhCN.feedback.petSkinUpdated
        : null;

  if (!state.activePet) {
    return (
      <PetOnboardingGuard>
        <div className="space-y-6">
          {error ? (
            <Card className="border-danger/40 bg-danger/10 text-sm text-red-100">{error}</Card>
          ) : successMessage ? (
            <Card className="border-success/40 bg-emerald-500/10 text-sm text-emerald-100">{successMessage}</Card>
          ) : null}
          <Card>
            <Pill className="text-accent">{zhCN.pet.panelBadge}</Pill>
            <h1 className="mt-4 text-3xl font-semibold text-white">{zhCN.pet.emptyTitle}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-mist">{zhCN.pet.emptyDescription}</p>
            <Link href="/shop/pet-egg" className="mt-6 inline-flex rounded-2xl bg-accent px-5 py-3 font-semibold text-slate-950">
              {zhCN.pet.emptyAction}
            </Link>
          </Card>
        </div>
      </PetOnboardingGuard>
    );
  }

  const activeVisual = getPetVisual(state.activePet.currentImageKey);

  return (
    <PetOnboardingGuard>
      <div className="space-y-6">
      {error ? (
        <Card className="border-danger/40 bg-danger/10 text-sm text-red-100">{error}</Card>
      ) : successMessage ? (
        <Card className="border-success/40 bg-emerald-500/10 text-sm text-emerald-100">{successMessage}</Card>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="overflow-hidden p-0">
          <div className={`border-b border-line bg-gradient-to-br ${activeVisual.accent} px-6 py-6`}>
            <Pill className="text-accent">{zhCN.pet.activeBadge}</Pill>
            <h1 className="mt-5 text-4xl font-semibold text-white">
              {formatText(zhCN.pet.activePetTitle, { name: state.activePet.displayName })}
            </h1>
            <p className="mt-3 text-sm leading-7 text-mist">{zhCN.pet.activePetDescription}</p>
          </div>
          <div className="px-6 py-6">
            <div className="rounded-[2rem] border border-white/10 bg-black/20 p-8 text-center">
              <div
                className={`mx-auto flex h-44 w-44 items-center justify-center rounded-full border border-white/10 text-7xl shadow-glow ${activeVisual.className}`}
              >
                {activeVisual.emoji}
              </div>
              <p className="mt-6 text-sm text-mist">{zhCN.pet.stageLabel}</p>
              <p className="mt-2 text-2xl text-white">{state.activePet.currentStage.nameZh}</p>
              <p className="mt-3 text-sm text-mist">{zhCN.pet.skinLabel}</p>
              <p className="mt-2 text-lg text-white">{state.activePet.activeSkin?.nameZh ?? zhCN.pet.skinDefault}</p>
              <p className="mt-3 text-sm text-mist">{formatText(zhCN.pet.obtainedAt, { date: formatShanghaiDate(state.activePet.obtainedAt) })}</p>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <Pill className="text-accentWarm">{zhCN.pet.progressBadge}</Pill>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-mist">{zhCN.pet.speciesLabel}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{state.activePet.species.nameZh}</p>
              </div>
              <div>
                <p className="text-sm text-mist">{zhCN.pet.exp}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{formatNumber(state.activePet.xp)}</p>
              </div>
              <div>
                <p className="text-sm text-mist">{zhCN.pet.nicknameLabel}</p>
                <form action={updatePetNicknameAction} className="mt-2 space-y-3">
                  <input type="hidden" name="userPetId" value={state.activePet.id} />
                  <input
                    type="text"
                    name="nickname"
                    defaultValue={state.activePet.nickname ?? ""}
                    maxLength={12}
                    placeholder={zhCN.pet.nicknamePlaceholder}
                    className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white outline-none transition focus:border-accent"
                  />
                  <button className="rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-slate-950">
                    {zhCN.pet.nicknameSaveButton}
                  </button>
                </form>
              </div>
            </div>
            <div className="mt-6 h-3 rounded-full bg-white/10">
              <div className="h-3 rounded-full bg-accent" style={{ width: `${state.activePet.progress.percent}%` }} />
            </div>
            <p className="mt-3 text-sm text-mist">
              {state.activePet.nextStage
                ? formatText(zhCN.pet.progressDetail, {
                    current: formatNumber(state.activePet.progress.current),
                    total: formatNumber(state.activePet.progress.total),
                  })
                : zhCN.pet.maxStageReached}
            </p>
            <p className="mt-3 text-sm text-mist">
              {state.activePet.nextStage
                ? formatText(zhCN.pet.nextStageGap, { exp: formatNumber(state.activePet.progress.remainingXp) })
                : zhCN.pet.maxStageReached}
            </p>
            <p className="mt-4 text-sm text-mist">{zhCN.pet.dailyXpHint}</p>
          </Card>

          <Card>
            <Pill className="text-accentWarm">{zhCN.pet.skinOwnedLabel}</Pill>
            <div className="mt-4 grid gap-3">
              <form action={applyPetSkinAction} className="rounded-2xl border border-line bg-black/20 p-4">
                <input type="hidden" name="userPetId" value={state.activePet.id} />
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">{zhCN.pet.skinDefault}</p>
                    <p className="mt-1 text-sm text-mist">{state.activePet.currentStage.nameZh}</p>
                  </div>
                  <button className="rounded-2xl border border-line px-4 py-2 text-sm text-white">
                    {zhCN.pet.skinRemoveButton}
                  </button>
                </div>
              </form>
              {state.activePet.ownedSkins.length === 0 ? (
                <p className="text-sm text-mist">{zhCN.pet.skinEmpty}</p>
              ) : (
                state.activePet.ownedSkins.map((skin) => {
                  const visual = getPetVisual(skin.imageKey);
                  const isActiveSkin = state.activePet.activeSkinId === skin.id;
                  const isDisabled = isActiveSkin || !skin.usable;

                  return (
                    <form
                      key={skin.id}
                      action={applyPetSkinAction}
                      className={`rounded-2xl border border-line bg-black/20 p-4 ${!skin.usable ? "opacity-60" : ""}`}
                    >
                      <input type="hidden" name="userPetId" value={state.activePet.id} />
                      <input type="hidden" name="skinId" value={skin.id} />
                      <div className="flex items-center gap-4">
                        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 text-3xl ${visual.className}`}>
                          {visual.emoji}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-lg font-semibold text-white">{skin.nameZh}</p>
                            {isActiveSkin ? <Pill>{zhCN.pet.activeTag}</Pill> : null}
                          </div>
                          <p className="mt-1 text-sm text-mist">{skin.descriptionZh}</p>
                          {!skin.usable && skin.stageIndex != null ? (
                            <p className="mt-2 text-sm text-mist">
                              {formatText(zhCN.pet.skinLockedHint, { stage: skin.stageIndex + 1 })}
                            </p>
                          ) : null}
                        </div>
                        <button
                          disabled={isDisabled}
                          className="rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-mist"
                        >
                          {isActiveSkin ? zhCN.pet.activatedButton : zhCN.pet.skinApplyButton}
                        </button>
                      </div>
                    </form>
                  );
                })
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-3">
              <Pill className="text-accent">{zhCN.pet.collectionBadge}</Pill>
              <Link href="/pokedex" className="text-sm text-mist underline decoration-white/20 underline-offset-4">
                {zhCN.nav.pokedex}
              </Link>
            </div>
            <div className="mt-4 grid gap-3">
              {state.pets.map((pet) => {
                const visual = getPetVisual(pet.currentImageKey);

                return (
                  <div key={pet.id} className="rounded-2xl border border-line bg-black/20 p-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 text-3xl ${visual.className}`}
                      >
                        {visual.emoji}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-lg font-semibold text-white">{pet.displayName}</p>
                          {pet.isActive ? <Pill>{zhCN.pet.activeTag}</Pill> : null}
                        </div>
                        <p className="mt-1 text-sm text-mist">
                          {pet.species.nameZh} · {pet.currentStage.nameZh} · XP {formatNumber(pet.xp)}
                        </p>
                        <p className="mt-1 text-sm text-mist">
                          {zhCN.pet.skinLabel}：{pet.activeSkin?.nameZh ?? zhCN.pet.skinDefault}
                        </p>
                      </div>
                      {pet.isActive ? (
                        <span className="rounded-2xl border border-line px-4 py-2 text-sm text-mist">{zhCN.pet.activatedButton}</span>
                      ) : (
                        <form action={setActivePetAction}>
                          <input type="hidden" name="userPetId" value={pet.id} />
                          <button className="rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-slate-950">
                            {zhCN.pet.activateButton}
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
      </div>
    </PetOnboardingGuard>
  );
}
