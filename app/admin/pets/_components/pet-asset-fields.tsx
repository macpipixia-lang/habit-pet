"use client";

import { useState } from "react";
import { zhCN } from "@/lib/i18n/zhCN";
import {
  getFileNameFromUrl,
  getUploadStatusLabel,
  type UploadResponse,
  type UploadStatus,
  uploadBlobFile,
} from "./pet-asset-upload";

export function PetAssetFields({
  initialCoverImageUrl,
  initialModelGlbUrl,
}: Readonly<{
  initialCoverImageUrl?: string | null;
  initialModelGlbUrl?: string | null;
}>) {
  const [coverImageUrl, setCoverImageUrl] = useState(initialCoverImageUrl ?? "");
  const [modelGlbUrl, setModelGlbUrl] = useState(initialModelGlbUrl ?? "");
  const [coverStatus, setCoverStatus] = useState<UploadStatus>("idle");
  const [modelStatus, setModelStatus] = useState<UploadStatus>("idle");
  const [coverError, setCoverError] = useState("");
  const [modelError, setModelError] = useState("");

  async function handleFileChange(
    file: File | undefined,
    folder: string,
    onStart: () => void,
    onSuccess: (payload: UploadResponse) => void,
    onError: (message: string) => void,
  ) {
    if (!file) {
      return;
    }

    onStart();

    try {
      const payload = await uploadBlobFile(file, folder);
      onSuccess(payload);
    } catch (error) {
      onError(error instanceof Error ? error.message : zhCN.feedback.fallbackError);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm text-mist" htmlFor="coverImageUrl">
            {zhCN.admin.coverImageLabel}
          </label>
          <input
            id="coverImageUrl"
            name="coverImageUrl"
            value={coverImageUrl}
            onChange={(event) => setCoverImageUrl(event.target.value)}
            className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
            placeholder="https://..."
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-mist" htmlFor="modelGlbUrl">
            {zhCN.admin.modelGlbLabel}
          </label>
          <input
            id="modelGlbUrl"
            name="modelGlbUrl"
            value={modelGlbUrl}
            onChange={(event) => setModelGlbUrl(event.target.value)}
            className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-line bg-black/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-white">{zhCN.admin.uploadCoverButton}</p>
            <span className="text-xs text-mist">{getUploadStatusLabel(coverStatus)}</span>
          </div>
          <input
            type="file"
            accept="image/*"
            className="mt-4 block w-full text-sm text-mist file:mr-4 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:font-medium file:text-slate-950"
            onChange={(event) =>
              handleFileChange(
                event.target.files?.[0],
                "pet-covers",
                () => {
                  setCoverStatus("uploading");
                  setCoverError("");
                },
                (payload) => {
                  setCoverStatus("success");
                  setCoverImageUrl(payload.url);
                },
                (message) => {
                  setCoverStatus("error");
                  setCoverError(message);
                },
              )
            }
          />
          {coverError ? <p className="mt-3 text-sm text-red-200">{coverError}</p> : null}
          {coverImageUrl ? (
            <div className="mt-4 space-y-3">
              <p className="text-xs text-mist">{zhCN.admin.imagePreviewLabel}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverImageUrl}
                alt={zhCN.admin.imagePreviewLabel}
                className="h-40 w-full rounded-2xl object-cover"
              />
            </div>
          ) : null}
        </div>

        <div className="rounded-3xl border border-line bg-black/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-white">{zhCN.admin.uploadModelButton}</p>
            <span className="text-xs text-mist">{getUploadStatusLabel(modelStatus)}</span>
          </div>
          <input
            type="file"
            accept=".glb,model/gltf-binary"
            className="mt-4 block w-full text-sm text-mist file:mr-4 file:rounded-full file:border-0 file:bg-accentWarm file:px-4 file:py-2 file:font-medium file:text-slate-950"
            onChange={(event) =>
              handleFileChange(
                event.target.files?.[0],
                "pet-models",
                () => {
                  setModelStatus("uploading");
                  setModelError("");
                },
                (payload) => {
                  setModelStatus("success");
                  setModelGlbUrl(payload.url);
                },
                (message) => {
                  setModelStatus("error");
                  setModelError(message);
                },
              )
            }
          />
          {modelError ? <p className="mt-3 text-sm text-red-200">{modelError}</p> : null}
          <div className="mt-4 rounded-2xl border border-line bg-black/20 p-4">
            <p className="text-xs text-mist">{zhCN.admin.modelPreviewLabel}</p>
            {modelGlbUrl ? (
              <a href={modelGlbUrl} target="_blank" rel="noreferrer" className="mt-2 block break-all text-sm text-white underline">
                {getFileNameFromUrl(modelGlbUrl)}
              </a>
            ) : (
              <p className="mt-2 text-sm text-mist">{zhCN.admin.modelPreviewEmpty}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
