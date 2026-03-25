"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";
import { zhCN } from "@/lib/i18n/zhCN";

export function CouponCodeModal({
  code,
  itemName,
}: {
  code: string;
  itemName: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      showToast("success", zhCN.feedback.copySuccess);
    } catch {
      showToast("error", zhCN.feedback.copyFailed);
    }
  }

  function handleClose() {
    startTransition(() => {
      router.replace("/shop");
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-line bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,244,233,0.94))] p-6 shadow-glow">
        <p className="text-sm text-accentWarm">{itemName}</p>
        <h2 className="mt-2 text-2xl font-semibold text-ink">{zhCN.shop.couponModalTitle}</h2>
        <p className="mt-3 text-sm leading-7 text-mist">{zhCN.shop.couponModalDescription}</p>
        <div className="mt-6 rounded-2xl border border-accent/30 bg-accent/10 p-4">
          <p className="text-sm text-mist">{zhCN.shop.couponCodeLabel}</p>
          <p className="mt-2 break-all text-lg font-semibold text-ink">{code}</p>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 rounded-2xl bg-accent px-4 py-3 font-semibold text-slate-950"
          >
            {zhCN.shop.copyButton}
          </button>
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="flex-1 rounded-2xl border border-line px-4 py-3 text-ink"
          >
            {zhCN.shop.closeButton}
          </button>
        </div>
      </div>
    </div>
  );
}
