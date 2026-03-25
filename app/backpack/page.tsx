import Link from "next/link";
import { RedeemCodeStatus } from "@prisma/client";
import { ClientActionForm } from "@/components/client-action-form";
import { PetOnboardingGuard } from "@/components/pet-onboarding-guard";
import { CopyCodeButton } from "@/components/copy-code-button";
import { Card, Pill } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getBackpackState } from "@/lib/data";
import { formatText, zhCN } from "@/lib/i18n/zhCN";
import { getPetVisual } from "@/lib/pets";
import { formatShanghaiDate } from "@/lib/time";
import { formatNumber } from "@/lib/utils";

function getRedeemStatusLabel(status: RedeemCodeStatus) {
  switch (status) {
    case "ISSUED":
      return zhCN.history.issued;
    case "REDEEMED":
      return zhCN.history.redeemed;
    case "VOID":
      return zhCN.history.void;
  }
}

export default async function BackpackPage({
  searchParams: _searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const state = await getBackpackState(user.id);

  return (
    <PetOnboardingGuard>
      <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Pill className="text-accent">{zhCN.backpack.badge}</Pill>
            <h1 className="mt-4 text-3xl font-semibold text-ink">{zhCN.backpack.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-mist">{zhCN.backpack.description}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-panelAlt/70 px-4 py-3">
              <p className="text-sm text-mist">{zhCN.backpack.pointsLabel}</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{formatNumber(state.profile.points)}</p>
            </div>
            <div className="rounded-2xl border border-line bg-panelAlt/70 px-4 py-3">
              <p className="text-sm text-mist">{zhCN.today.makeupCards}</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{formatNumber(state.profile.makeupCards)}</p>
            </div>
          </div>
        </div>
      </Card>

      <details open className="group">
        <summary className="list-none">
          <Card className="cursor-pointer">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Pill className="text-accent">{zhCN.backpack.petsTitle}</Pill>
                <p className="mt-3 text-sm text-mist">{zhCN.backpack.petsDescription}</p>
              </div>
              <span className="text-sm text-mist group-open:hidden">{zhCN.backpack.sectionOpen}</span>
              <span className="hidden text-sm text-mist group-open:inline">{zhCN.backpack.sectionClose}</span>
            </div>
          </Card>
        </summary>
        <div className="mt-4 space-y-4">
          {state.ownedPets.length === 0 ? (
            <Card className="text-sm text-mist">
              {zhCN.backpack.petsEmpty}{" "}
              <Link href="/shop/pet-egg" className="text-ink underline decoration-accent/35 underline-offset-4">
                {zhCN.pet.emptyAction}
              </Link>
            </Card>
          ) : (
            state.ownedPets.map((pet) => {
              return (
                <Card key={pet.id}>
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <div className="flex w-16 aspect-square shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-accent/15 bg-panelAlt/70">
                        {/* 当前出战宠物优先展示阶段封面，列表项也保持同一口径。 */}
                        <img
                          src={pet.currentStageCoverImageUrl}
                          alt={pet.currentStage.nameZh}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-xl font-semibold text-ink">{pet.displayName}</p>
                          {pet.isActive ? <Pill>{zhCN.pet.activeTag}</Pill> : null}
                        </div>
                        <p className="mt-2 text-sm text-mist">
                          {formatText(zhCN.backpack.speciesSummary, { name: pet.species.nameZh })}
                        </p>
                        <p className="mt-1 text-sm text-mist">
                          {formatText(zhCN.backpack.stageSummary, { name: pet.currentStage.nameZh })}
                        </p>
                        <p className="mt-1 text-sm text-mist">{zhCN.backpack.coverPreviewHint}</p>
                        <p className="mt-1 text-sm text-mist">
                          {formatText(zhCN.backpack.activePetSummary, {
                            skin: pet.activeSkin?.nameZh ?? zhCN.pet.skinDefault,
                            xp: formatNumber(pet.xp),
                          })}
                        </p>
                        <p className="mt-1 text-sm text-mist">
                          {formatText(zhCN.backpack.skinSummary, { count: pet.availableSkins.length })}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:w-[26rem]">
                      <div className="space-y-3 rounded-2xl border border-line bg-panelAlt/70 p-4 sm:col-span-2">
                        <label className="block text-sm text-mist">{zhCN.pet.nicknameLabel}</label>
                        {pet.nicknameUpdatedAt ? (
                          <div className="space-y-2">
                            <p className="text-ink">{pet.nickname?.trim() || zhCN.pet.nicknameEmpty}</p>
                            <p className="text-xs text-mist">{zhCN.pet.nicknameLocked}</p>
                          </div>
                        ) : (
                          <details>
                            <summary className="inline-flex cursor-pointer list-none rounded-2xl border border-line px-4 py-2 text-sm text-ink">
                              {zhCN.pet.nicknameSetButton}
                            </summary>
                            <ClientActionForm action="/api/pet/nickname" successMessage={zhCN.feedback.petNicknameUpdated} className="mt-3 space-y-3">
                              <input type="hidden" name="userPetId" value={pet.id} />
                              <input
                                type="text"
                                name="nickname"
                                defaultValue={pet.nickname ?? ""}
                                maxLength={12}
                                placeholder={zhCN.pet.nicknamePlaceholder}
                                className="w-full rounded-2xl border border-line bg-panelAlt/70 px-4 py-3 text-ink outline-none transition focus:border-accent"
                              />
                              <button className="rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-slate-950">
                                {zhCN.pet.nicknameSaveButton}
                              </button>
                            </ClientActionForm>
                          </details>
                        )}
                      </div>

                      <ClientActionForm action="/api/pet/skin/apply" successMessage={zhCN.feedback.petSkinUpdated} className="rounded-2xl border border-line bg-panelAlt/70 p-4">
                        <input type="hidden" name="userPetId" value={pet.id} />
                        <p className="text-sm text-mist">{zhCN.pet.skinLabel}</p>
                        <p className="mt-2 text-ink">{pet.activeSkin?.nameZh ?? zhCN.pet.skinDefault}</p>
                        <button className="mt-4 rounded-2xl border border-line px-4 py-2 text-sm text-ink">
                          {zhCN.pet.skinRemoveButton}
                        </button>
                      </ClientActionForm>

                      <div className="rounded-2xl border border-line bg-panelAlt/70 p-4">
                        <p className="text-sm text-mist">{zhCN.backpack.obtainedAtLabel}</p>
                        <p className="mt-2 text-ink">{formatShanghaiDate(pet.obtainedAt)}</p>
                        {pet.isActive ? (
                          <span className="mt-4 inline-flex rounded-2xl border border-line px-4 py-2 text-sm text-mist">
                            {zhCN.pet.activatedButton}
                          </span>
                        ) : (
                          <ClientActionForm action="/api/pet/active" successMessage={zhCN.feedback.activePetUpdated} className="mt-4">
                            <input type="hidden" name="userPetId" value={pet.id} />
                            <button className="rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-slate-950">
                              {zhCN.pet.activateButton}
                            </button>
                          </ClientActionForm>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </details>

      <details className="group">
        <summary className="list-none">
          <Card className="cursor-pointer">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Pill className="text-accentWarm">{zhCN.backpack.skinsTitle}</Pill>
                <p className="mt-3 text-sm text-mist">{zhCN.backpack.skinsDescription}</p>
              </div>
              <span className="text-sm text-mist group-open:hidden">{zhCN.backpack.sectionOpen}</span>
              <span className="hidden text-sm text-mist group-open:inline">{zhCN.backpack.sectionClose}</span>
            </div>
          </Card>
        </summary>
        <div className="mt-4 grid gap-4">
          {state.ownedSkins.length === 0 ? (
            <Card className="text-sm text-mist">{zhCN.backpack.skinsEmpty}</Card>
          ) : (
            state.ownedSkins.map((skin) => {
              const visual = getPetVisual(skin.imageKey);
              const ownedSpeciesPets = state.ownedPets.filter((pet) => !skin.speciesId || pet.speciesId === skin.speciesId);
              const usablePets = ownedSpeciesPets.filter((pet) =>
                pet.availableSkins.some((availableSkin) => availableSkin.id === skin.id),
              );
              const activePets = state.ownedPets.filter((pet) => pet.activeSkinId === skin.id);
              const speciesLabel = skin.speciesNameZh ?? zhCN.backpack.skinGenericHint;

              return (
                <Card key={skin.id}>
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 text-3xl ${visual.className}`}>
                        {visual.emoji}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-xl font-semibold text-ink">{skin.nameZh}</p>
                          {activePets.length > 0 ? <Pill>{zhCN.backpack.skinAppliedTag}</Pill> : null}
                        </div>
                        <p className="mt-2 text-sm text-mist">{skin.descriptionZh}</p>
                        <p className="mt-2 text-sm text-mist">
                          {formatText(zhCN.backpack.skinSpecies, {
                            name: speciesLabel,
                          })}
                        </p>
                        {skin.stageIndex != null ? (
                          <p className="mt-1 text-sm text-mist">
                            {formatText(zhCN.backpack.skinStageHint, { stage: skin.stageIndex + 1 })}
                          </p>
                        ) : null}
                        {activePets.length > 0 ? (
                          <p className="mt-1 text-sm text-mist">
                            {formatText(zhCN.backpack.skinActiveOn, { name: activePets.map((pet) => pet.displayName).join(" / ") })}
                          </p>
                        ) : usablePets.length > 0 ? (
                          <p className="mt-1 text-sm text-mist">
                            {formatText(zhCN.backpack.skinUnlockedFor, { count: usablePets.length })}
                          </p>
                        ) : ownedSpeciesPets.length === 0 ? (
                          <p className="mt-1 text-sm text-mist">{zhCN.backpack.skinMissingSpecies}</p>
                        ) : skin.stageIndex != null ? (
                          <p className="mt-1 text-sm text-mist">
                            {formatText(zhCN.backpack.skinStageHint, { stage: skin.stageIndex + 1 })}
                          </p>
                        ) : (
                          <p className="mt-1 text-sm text-mist">{zhCN.backpack.skinNoUsablePet}</p>
                        )}
                      </div>
                    </div>

                    <div className="w-full rounded-2xl border border-line bg-panelAlt/70 p-4 lg:w-[20rem]">
                      {usablePets.length > 0 ? (
                        <ClientActionForm action="/api/pet/skin/apply" successMessage={zhCN.feedback.petSkinUpdated} className="space-y-3">
                          <input type="hidden" name="skinId" value={skin.id} />
                          <label className="block text-sm text-mist" htmlFor={`pet-${skin.id}`}>
                            {zhCN.backpack.skinApplyLabel}
                          </label>
                          <select
                            id={`pet-${skin.id}`}
                            name="userPetId"
                            defaultValue={usablePets[0]?.id}
                            className="w-full rounded-2xl border border-line bg-panelAlt/70 px-4 py-3 text-ink outline-none transition focus:border-accent"
                          >
                            {usablePets.map((pet) => (
                              <option key={pet.id} value={pet.id}>
                                {pet.displayName} · {pet.currentStage.nameZh}
                              </option>
                            ))}
                          </select>
                          <button className="rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-slate-950">
                            {zhCN.backpack.skinApplyButton}
                          </button>
                        </ClientActionForm>
                      ) : (
                        <p className="text-sm text-mist">
                          {ownedSpeciesPets.length === 0
                            ? zhCN.backpack.skinMissingSpecies
                            : skin.stageIndex != null
                              ? formatText(zhCN.backpack.skinStageHint, { stage: skin.stageIndex + 1 })
                              : zhCN.backpack.skinNoUsablePet}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </details>

      <details className="group">
        <summary className="list-none">
          <Card className="cursor-pointer">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Pill className="text-accent">{zhCN.backpack.couponsTitle}</Pill>
                <p className="mt-3 text-sm text-mist">{zhCN.backpack.couponsDescription}</p>
              </div>
              <span className="text-sm text-mist group-open:hidden">{zhCN.backpack.sectionOpen}</span>
              <span className="hidden text-sm text-mist group-open:inline">{zhCN.backpack.sectionClose}</span>
            </div>
          </Card>
        </summary>
        <div className="mt-4 grid gap-4">
          {state.redeemCodes.length === 0 ? (
            <Card className="text-sm text-mist">{zhCN.backpack.couponsEmpty}</Card>
          ) : (
            state.redeemCodes.map((code) => (
              <Card key={code.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-lg font-semibold text-ink">{code.item.nameZh}</p>
                      <Pill>{getRedeemStatusLabel(code.status)}</Pill>
                    </div>
                    <p className="mt-2 break-all text-sm text-ink">{formatText(zhCN.history.codeValue, { code: code.id })}</p>
                    <p className="mt-2 text-sm text-mist">
                      {formatText(zhCN.backpack.codeIssuedAt, { date: formatShanghaiDate(code.issuedAt) })}
                    </p>
                    {code.redeemedAt ? (
                      <p className="mt-1 text-sm text-mist">
                        {formatText(zhCN.backpack.codeRedeemedAt, { date: formatShanghaiDate(code.redeemedAt) })}
                      </p>
                    ) : null}
                    {code.adminNote ? (
                      <p className="mt-1 text-sm text-mist">
                        {formatText(zhCN.history.adminNote, { note: code.adminNote })}
                      </p>
                    ) : null}
                  </div>
                  <CopyCodeButton code={code.id} className="rounded-2xl border border-line px-4 py-2 text-sm text-ink" />
                </div>
              </Card>
            ))
          )}
        </div>
      </details>

      <details className="group">
        <summary className="list-none">
          <Card className="cursor-pointer">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Pill className="text-accentWarm">{zhCN.backpack.makeupCardsTitle}</Pill>
                <p className="mt-3 text-sm text-mist">{zhCN.backpack.makeupCardsDescription}</p>
              </div>
              <span className="text-sm text-mist group-open:hidden">{zhCN.backpack.sectionOpen}</span>
              <span className="hidden text-sm text-mist group-open:inline">{zhCN.backpack.sectionClose}</span>
            </div>
          </Card>
        </summary>
        <div className="mt-4">
          <Card>
            <p className="text-sm text-mist">{zhCN.today.makeupCards}</p>
            <p className="mt-3 text-4xl font-semibold text-ink">{formatNumber(state.profile.makeupCards)}</p>
            <p className="mt-3 text-sm leading-7 text-mist">{zhCN.today.makeupCardsHint}</p>
            <p className="mt-3 text-sm leading-7 text-mist">{zhCN.backpack.makeupCardsHint}</p>
          </Card>
        </div>
      </details>
      </div>
    </PetOnboardingGuard>
  );
}
