"use client";

import { useToast } from "@/components/toast-provider";
import { zhCN } from "@/lib/i18n/zhCN";

export function CopyCodeButton({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  const { showToast } = useToast();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      showToast("success", zhCN.feedback.copySuccess);
    } catch {
      showToast("error", zhCN.feedback.copyFailed);
    }
  }

  return (
    <button type="button" onClick={handleCopy} className={className}>
      {zhCN.shop.copyButton}
    </button>
  );
}
