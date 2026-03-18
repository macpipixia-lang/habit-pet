"use client";

import { useEffect } from "react";
import { useToast } from "@/components/toast-provider";
import { zhCN } from "@/lib/i18n/zhCN";
import { postJson } from "@/lib/client-api";

export type AdminApiResponse<T> = {
  ok: boolean;
  message?: string;
  data?: T;
};

export type AdminNotice = {
  type: "error" | "success";
  text: string;
};

export function AdminNoticeCard(_props: {
  notice: AdminNotice | null;
}) {
  return null;
}

export function useAdminNotice(initialNotice?: AdminNotice | null) {
  const { showToast } = useToast();

  useEffect(() => {
    if (!initialNotice) {
      return;
    }

    showToast(initialNotice.type, initialNotice.text);
  }, [initialNotice, showToast]);

  return {
    notify: (notice: AdminNotice) => showToast(notice.type, notice.text),
  };
}

export async function postAdminJson<T>(url: string, body: Record<string, unknown>) {
  return postJson<T>(url, body) as Promise<AdminApiResponse<T>>;
}
