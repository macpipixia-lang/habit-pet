"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";
import { postJson } from "@/lib/client-api";
import { zhCN } from "@/lib/i18n/zhCN";

export function ClientActionForm({
  action,
  successMessage,
  redirectTo,
  refreshOnSuccess = true,
  className,
  children,
}: Readonly<{
  action: string;
  successMessage: string;
  redirectTo?: string;
  refreshOnSuccess?: boolean;
  className?: string;
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (pending) {
      return;
    }

    setPending(true);

    try {
      const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
      await postJson(action, payload);
      showToast("success", successMessage);

      if (redirectTo) {
        router.push(redirectTo);
      } else if (refreshOnSuccess) {
        router.refresh();
      }
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : zhCN.feedback.fallbackError);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
    </form>
  );
}
