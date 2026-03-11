"use client";

import { useState } from "react";
import { zhCN } from "@/lib/i18n/zhCN";

export function CopyCodeButton({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  const [message, setMessage] = useState<string | null>(null);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setMessage(zhCN.feedback.copySuccess);
    } catch {
      setMessage(zhCN.feedback.copyFailed);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={handleCopy} className={className}>
        {zhCN.shop.copyButton}
      </button>
      {message ? <p className="text-xs text-mist">{message}</p> : null}
    </div>
  );
}
