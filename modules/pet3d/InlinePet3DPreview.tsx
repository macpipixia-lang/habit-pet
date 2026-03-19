"use client";

import { useState } from "react";
import { zhCN } from "@/lib/i18n/zhCN";
import { cn } from "@/lib/utils";
import { Pet3DViewer } from "@/modules/pet3d/Pet3DViewer";

type InlinePet3DPreviewProps = {
  imageSrc: string;
  imageAlt: string;
  modelSrc: string;
  viewerKey: string;
  petName: string;
  concealed?: boolean;
  disabled?: boolean;
};

export function InlinePet3DPreview({
  imageSrc,
  imageAlt,
  modelSrc,
  viewerKey,
  petName,
  concealed = false,
  disabled = false,
}: InlinePet3DPreviewProps) {
  const [show3d, setShow3d] = useState(false);
  const button = (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={show3d}
      onClick={() => setShow3d((current) => !current)}
      className={cn(
        "absolute right-3 top-3 z-10 rounded-full border px-3 py-1.5 text-xs font-medium transition backdrop-blur",
        disabled
          ? "cursor-not-allowed border-line bg-panel/80 text-mist/70"
          : "border-line bg-panel/90 text-ink hover:border-accent/40",
      )}
    >
      {show3d ? zhCN.pet.inline3dHide : zhCN.pet.inline3dShow}
    </button>
  );

  if (show3d && !disabled) {
    return <Pet3DViewer viewerKey={viewerKey} modelSrc={modelSrc} petName={petName} overlay={button} showActions={false} />;
  }

  return (
    <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-3xl border border-line bg-panel/80">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageSrc} alt={imageAlt} className={cn("h-full w-full object-cover", concealed && "blur-md saturate-0")} />
      {button}
    </div>
  );
}
