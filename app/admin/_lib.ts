import type { RedeemCodeStatus } from "@prisma/client";

export async function getAdminPageParams(
  searchParams?: Promise<Record<string, string | string[] | undefined>>,
) {
  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? params.error : null;
  const success = typeof params.success === "string" ? params.success : null;
  const status =
    typeof params.status === "string" && ["ISSUED", "REDEEMED", "VOID"].includes(params.status)
      ? (params.status as RedeemCodeStatus)
      : undefined;
  const code = typeof params.code === "string" ? params.code.trim() : "";

  return {
    error,
    success,
    status,
    code,
  };
}
