import { zhCN } from "@/lib/i18n/zhCN";

export type ApiResponse<T> = {
  ok: boolean;
  message?: string;
  error?: string;
  data?: T;
};

export async function postJson<T>(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.ok) {
    throw new Error(payload.message || payload.error || zhCN.feedback.fallbackError);
  }

  return payload;
}
