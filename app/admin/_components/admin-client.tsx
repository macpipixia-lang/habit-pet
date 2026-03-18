"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import { zhCN } from "@/lib/i18n/zhCN";

export type AdminApiResponse<T> = {
  ok: boolean;
  message?: string;
  data?: T;
};

export type AdminNotice = {
  type: "error" | "success";
  text: string;
};

export function AdminNoticeCard({
  notice,
}: {
  notice: AdminNotice | null;
}) {
  if (!notice) {
    return null;
  }

  return (
    <Card
      className={
        notice.type === "error"
          ? "border-danger/40 bg-danger/10 text-sm text-red-100"
          : "border-success/40 bg-emerald-500/10 text-sm text-emerald-100"
      }
    >
      {notice.text}
    </Card>
  );
}

export function useAdminNotice(initialNotice?: AdminNotice | null) {
  return useState<AdminNotice | null>(initialNotice ?? null);
}

export async function postAdminJson<T>(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as AdminApiResponse<T>;

  if (!response.ok || !payload.ok) {
    throw new Error(payload.message || zhCN.feedback.fallbackError);
  }

  return payload;
}
