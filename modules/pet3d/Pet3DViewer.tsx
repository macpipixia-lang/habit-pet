"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { zhCN } from "@/lib/i18n/zhCN";
import { cn } from "@/lib/utils";
import { PET_3D_ACTIONS, type Pet3DAction } from "@/modules/pet3d/pet3d";

type Pet3DViewerProps = {
  viewerKey: string;
  modelSrc: string;
  petName: string;
};

type ToastState = {
  id: number;
  message: string;
} | null;

export function Pet3DViewer({ viewerKey, modelSrc, petName }: Pet3DViewerProps) {
  const viewerRef = useRef<ModelViewerElement | null>(null);
  const [selectedAction, setSelectedAction] = useState<Pet3DAction>("Idle");
  const [toast, setToast] = useState<ToastState>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelError, setModelError] = useState(false);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setToast((current) => (current?.id === toast.id ? null : current));
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    const viewer = viewerRef.current;

    if (!viewer) {
      return;
    }

    applyAction(viewer, selectedAction, () => {
      setToast({
        id: Date.now(),
        message: zhCN.pet.mode3dUnsupportedAction,
      });
    });
  }, [selectedAction]);

  useEffect(() => {
    const viewer = viewerRef.current;

    if (!viewer) {
      return;
    }

    setModelLoaded(false);
    setModelError(false);

    const onLoad = () => setModelLoaded(true);
    const onError = () => {
      setModelLoaded(false);
      setModelError(true);
    };

    viewer.addEventListener("load", onLoad);
    viewer.addEventListener("error", onError);

    return () => {
      viewer.removeEventListener("load", onLoad);
      viewer.removeEventListener("error", onError);
    };
  }, [modelSrc]);

  return (
    <div className="space-y-4">
      <Script
        id="model-viewer-loader"
        type="module"
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.1.0/model-viewer.min.js"
      />
      <div className="relative overflow-hidden rounded-[2rem] border border-line bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.16),_transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(15,23,42,0.12))] p-3">
        <model-viewer
          ref={viewerRef}
          key={viewerKey}
          src={modelSrc}
          camera-controls
          shadow-intensity="1"
          exposure="1"
          autoplay
          animation-name="Idle"
          interaction-prompt="none"
          className="h-[360px] w-full overflow-hidden rounded-[1.6rem] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.14),_rgba(15,23,42,0.94)_72%)]"
        />

        {!modelLoaded ? (
          <div className="pointer-events-none absolute inset-3 flex items-center justify-center rounded-[1.6rem] bg-black/30 text-sm text-mist backdrop-blur">
            {modelError ? zhCN.pet.mode3dLoadFailed : zhCN.pet.mode3dLoading}
          </div>
        ) : null}

        <div className="pointer-events-none absolute inset-x-6 bottom-6 rounded-2xl border border-white/10 bg-black/45 px-4 py-3 backdrop-blur">
          <p className="text-sm text-white">{petName}</p>
          <p className="mt-1 text-xs text-mist">{zhCN.pet.mode3dModelFallback}</p>
        </div>
        {toast ? (
          <div className="absolute right-4 top-4 rounded-2xl border border-danger/40 bg-danger/90 px-4 py-2 text-sm text-white shadow-lg">
            {toast.message}
          </div>
        ) : null}
      </div>
      <div>
        <p className="text-sm text-mist">{zhCN.pet.mode3dActionsLabel}</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {PET_3D_ACTIONS.map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => setSelectedAction(action)}
              className={cn(
                "rounded-2xl border px-4 py-2 text-sm transition",
                selectedAction === action
                  ? "border-accent bg-accent text-slate-950"
                  : "border-line bg-black/20 text-white hover:border-white/30",
              )}
            >
              {ACTION_LABELS[action]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const ACTION_LABELS: Record<Pet3DAction, string> = {
  Idle: zhCN.pet.actionIdle,
  Pet: zhCN.pet.actionPet,
  Eat: zhCN.pet.actionEat,
};

function applyAction(
  viewer: ModelViewerElement,
  action: Pet3DAction,
  onUnsupported: () => void,
) {
  const availableAnimations = viewer.availableAnimations ?? [];

  if (!availableAnimations.includes(action)) {
    if (action !== "Idle") {
      onUnsupported();
    }

    if (availableAnimations.includes("Idle")) {
      viewer.animationName = "Idle";
      viewer.play();
    }

    return;
  }

  viewer.animationName = action;
  viewer.currentTime = 0;
  viewer.play();
}
