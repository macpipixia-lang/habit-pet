"use client";

import Link from "next/link";
import { Card, Pill } from "@/components/ui";
import { formatText, zhCN } from "@/lib/i18n/zhCN";
import { formatNumber } from "@/lib/utils";
import { Pet3DViewer } from "@/modules/pet3d/Pet3DViewer";
import { getPet3DModelSrc, type Pet3DActivePet } from "@/modules/pet3d/pet3d";

type Pet3DCardProps = {
  pet: Pet3DActivePet;
};

export function Pet3DCard({ pet }: Pet3DCardProps) {
  const modelSrc = getPet3DModelSrc(pet);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm text-mist">
          <Link href="/pet" className="rounded-full border border-line px-3 py-1 text-white transition hover:border-white/30">
            {zhCN.pet.mode3dBack}
          </Link>
          <span>/</span>
          <span>{zhCN.nav.pet}</span>
          <span>/</span>
          <span className="text-white">{zhCN.pet.mode3dBreadcrumb}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-line bg-gradient-to-br from-amber-300/20 via-sky-300/10 to-transparent px-6 py-6">
            <Pill className="text-accent">{zhCN.pet.mode3dTitle}</Pill>
            <h1 className="mt-4 text-3xl font-semibold text-white">
              {formatText(zhCN.pet.activePetTitle, { name: pet.displayName })}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-mist">{zhCN.pet.mode3dDescription}</p>
          </div>
          <div className="px-6 py-6">
            <Pet3DViewer modelSrc={modelSrc} petName={pet.displayName} />
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <Pill className="text-accentWarm">{zhCN.pet.mode3dStatsTitle}</Pill>
            <div className="mt-4 space-y-4 rounded-[2rem] border border-line bg-black/20 p-5">
              <div>
                <p className="text-sm text-mist">{zhCN.pet.speciesLabel}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{pet.species.nameZh}</p>
              </div>
              <div>
                <p className="text-sm text-mist">{zhCN.pet.stageLabel}</p>
                <p className="mt-2 text-xl text-white">{pet.currentStage.nameZh}</p>
              </div>
              <div>
                <p className="text-sm text-mist">{zhCN.pet.skinLabel}</p>
                <p className="mt-2 text-xl text-white">{pet.activeSkin?.nameZh ?? zhCN.pet.skinDefault}</p>
              </div>
              <div>
                <p className="text-sm text-mist">{zhCN.pet.exp}</p>
                <p className="mt-2 text-xl text-white">{formatNumber(pet.xp)}</p>
              </div>
            </div>
          </Card>

          <Card>
            <Pill className="text-accentWarm">{zhCN.pet.mode3dViewerLabel}</Pill>
            <p className="mt-4 text-sm leading-7 text-mist">{zhCN.pet.mode3dHint}</p>
            <Link
              href="/pet"
              className="mt-5 inline-flex rounded-2xl border border-line px-4 py-2 text-sm text-white transition hover:border-white/30"
            >
              {zhCN.pet.mode3dBack}
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
