"use client";

import { useState } from "react";
import { Card, Pill } from "@/components/ui";
import { formatText, zhCN } from "@/lib/i18n/zhCN";
import {
  getFileNameFromUrl,
  getUploadStatusLabel,
  type UploadStatus,
  uploadBlobFile,
} from "./pet-asset-upload";

type StageAssetValue = {
  id: string;
  stageIndex: number;
  nameZh: string;
  coverImageUrl: string;
  modelGlbUrl: string;
};

type StageUploadState = {
  coverStatus: UploadStatus;
  modelStatus: UploadStatus;
  coverError: string;
  modelError: string;
};

export function PetStageAssetFields({
  stages,
  onUploadResult,
}: Readonly<{
  stages: Array<{
    id: string;
    stageIndex: number;
    nameZh: string;
    coverImageUrl?: string | null;
    modelGlbUrl?: string | null;
  }>;
  onUploadResult: (type: "success" | "error", message: string) => void;
}>) {
  const [stageValues, setStageValues] = useState<StageAssetValue[]>(
    stages.map((stage) => ({
      id: stage.id,
      stageIndex: stage.stageIndex,
      nameZh: stage.nameZh,
      coverImageUrl: stage.coverImageUrl ?? "",
      modelGlbUrl: stage.modelGlbUrl ?? "",
    })),
  );
  const [uploadStates, setUploadStates] = useState<Record<string, StageUploadState>>(
    Object.fromEntries(
      stages.map((stage) => [
        stage.id,
        {
          coverStatus: "idle",
          modelStatus: "idle",
          coverError: "",
          modelError: "",
        },
      ]),
    ),
  );

  const serializedValue = JSON.stringify(
    stageValues.map((stage) => ({
      id: stage.id,
      nameZh: stage.nameZh.trim(),
      coverImageUrl: stage.coverImageUrl.trim(),
      modelGlbUrl: stage.modelGlbUrl.trim(),
    })),
  );

  function updateStageValue(stageId: string, key: "nameZh" | "coverImageUrl" | "modelGlbUrl", value: string) {
    setStageValues((current) => current.map((stage) => (stage.id === stageId ? { ...stage, [key]: value } : stage)));
  }

  function updateStageUploadState(stageId: string, next: Partial<StageUploadState>) {
    setUploadStates((current) => ({
      ...current,
      [stageId]: {
        ...current[stageId],
        ...next,
      },
    }));
  }

  async function handleUpload(stageId: string, file: File | undefined, kind: "cover" | "model") {
    if (!file) {
      return;
    }

    updateStageUploadState(stageId, kind === "cover"
      ? { coverStatus: "uploading", coverError: "" }
      : { modelStatus: "uploading", modelError: "" });

    try {
      const payload = await uploadBlobFile(file, "pet-stage");
      if (kind === "cover") {
        updateStageValue(stageId, "coverImageUrl", payload.url);
        updateStageUploadState(stageId, { coverStatus: "success" });
        onUploadResult("success", zhCN.admin.uploadSuccess);
      } else {
        updateStageValue(stageId, "modelGlbUrl", payload.url);
        updateStageUploadState(stageId, { modelStatus: "success" });
        onUploadResult("success", zhCN.admin.uploadSuccess);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : zhCN.feedback.fallbackError;
      onUploadResult("error", message);
      updateStageUploadState(stageId, kind === "cover"
        ? { coverStatus: "error", coverError: message }
        : { modelStatus: "error", modelError: message });
    }
  }

  if (stageValues.length === 0) {
    return (
      <Card className="border border-line bg-black/20">
        <Pill className="text-accentWarm">{zhCN.admin.stageAssetsTitle}</Pill>
        <p className="mt-3 text-sm text-mist">{zhCN.admin.stageAssetsEmpty}</p>
      </Card>
    );
  }

  return (
    <Card>
      <input type="hidden" name="stageAssetsJson" value={serializedValue} />
      <Pill className="text-accentWarm">{zhCN.admin.stageAssetsTitle}</Pill>
      <p className="mt-3 text-sm leading-7 text-mist">{zhCN.admin.stageAssetsDescription}</p>
      <div className="mt-6 space-y-5">
        {stageValues
          .slice()
          .sort((left, right) => left.stageIndex - right.stageIndex)
          .map((stage) => {
            const uploadState = uploadStates[stage.id] ?? {
              coverStatus: "idle" as const,
              modelStatus: "idle" as const,
              coverError: "",
              modelError: "",
            };

            return (
              <div key={stage.id} className="rounded-3xl border border-line bg-black/20 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">{stage.nameZh}</p>
                    <p className="mt-1 text-sm text-mist">
                      {formatText(zhCN.pokedex.stageLabel, { index: stage.stageIndex + 1 })}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm text-mist" htmlFor={`stage-name-${stage.id}`}>
                      {zhCN.admin.stageNameLabel}
                    </label>
                    <input
                      id={`stage-name-${stage.id}`}
                      value={stage.nameZh}
                      onChange={(event) => updateStageValue(stage.id, "nameZh", event.target.value)}
                      className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-mist" htmlFor={`stage-cover-${stage.id}`}>
                      {zhCN.admin.stageAssetsCoverLabel}
                    </label>
                    <input
                      id={`stage-cover-${stage.id}`}
                      value={stage.coverImageUrl}
                      onChange={(event) => updateStageValue(stage.id, "coverImageUrl", event.target.value)}
                      className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-mist" htmlFor={`stage-model-${stage.id}`}>
                      {zhCN.admin.stageAssetsModelLabel}
                    </label>
                    <input
                      id={`stage-model-${stage.id}`}
                      value={stage.modelGlbUrl}
                      onChange={(event) => updateStageValue(stage.id, "modelGlbUrl", event.target.value)}
                      className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-3xl border border-line bg-black/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-white">{zhCN.admin.stageAssetsUploadCoverButton}</p>
                      <span className="text-xs text-mist">{getUploadStatusLabel(uploadState.coverStatus)}</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="mt-4 block w-full text-sm text-mist file:mr-4 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:font-medium file:text-slate-950"
                      onChange={(event) => void handleUpload(stage.id, event.target.files?.[0], "cover")}
                    />
                    {uploadState.coverError ? <p className="mt-3 text-sm text-red-200">{uploadState.coverError}</p> : null}
                    {stage.coverImageUrl ? (
                      <div className="mt-4 space-y-3">
                        <p className="text-xs text-mist">{zhCN.admin.imagePreviewLabel}</p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={stage.coverImageUrl}
                          alt={stage.nameZh}
                          className="h-40 w-full rounded-2xl object-cover"
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-3xl border border-line bg-black/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-white">{zhCN.admin.stageAssetsUploadModelButton}</p>
                      <span className="text-xs text-mist">{getUploadStatusLabel(uploadState.modelStatus)}</span>
                    </div>
                    <input
                      type="file"
                      accept=".glb,model/gltf-binary"
                      className="mt-4 block w-full text-sm text-mist file:mr-4 file:rounded-full file:border-0 file:bg-accentWarm file:px-4 file:py-2 file:font-medium file:text-slate-950"
                      onChange={(event) => void handleUpload(stage.id, event.target.files?.[0], "model")}
                    />
                    {uploadState.modelError ? <p className="mt-3 text-sm text-red-200">{uploadState.modelError}</p> : null}
                    <div className="mt-4 rounded-2xl border border-line bg-black/20 p-4">
                      <p className="text-xs text-mist">{zhCN.admin.modelPreviewLabel}</p>
                      {stage.modelGlbUrl ? (
                        <a
                          href={stage.modelGlbUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 block break-all text-sm text-white underline"
                        >
                          {getFileNameFromUrl(stage.modelGlbUrl)}
                        </a>
                      ) : (
                        <p className="mt-2 text-sm text-mist">{zhCN.admin.modelPreviewEmpty}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </Card>
  );
}
