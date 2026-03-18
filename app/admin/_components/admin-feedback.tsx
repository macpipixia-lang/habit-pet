"use client";

import { useEffect } from "react";
import { useToast } from "@/components/toast-provider";

export function AdminFeedback({
  error,
  successMessage,
}: Readonly<{
  error: string | null;
  successMessage: string | null;
}>) {
  const { showToast } = useToast();

  useEffect(() => {
    if (error) {
      showToast("error", error);
      return;
    }

    if (successMessage) {
      showToast("success", successMessage);
    }
  }, [error, showToast, successMessage]);

  return null;
}
