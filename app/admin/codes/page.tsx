import { AdminCodesClient } from "@/app/admin/codes/codes-client";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getAdminRedeemCodes } from "@/lib/data";
import { zhCN } from "@/lib/i18n/zhCN";

export default async function AdminCodesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = (await searchParams) ?? {};
  const status = typeof params.status === "string" ? params.status : "";
  const code = typeof params.code === "string" ? params.code : "";
  const redeemCodes = await getAdminRedeemCodes(
    status === "ISSUED" || status === "REDEEMED" || status === "VOID" ? status : undefined,
    code || undefined,
  );
  const error = typeof params.error === "string" ? params.error : null;
  const success = typeof params.success === "string" ? params.success : null;
  const initialNotice = error
    ? { type: "error" as const, text: error }
    : success
      ? { type: "success" as const, text: zhCN.feedback.codeUpdated }
      : null;

  return (
    <AdminShell activePath="/admin/codes" title={zhCN.admin.codesTitle} description={zhCN.admin.codesDescription}>
      <form className="mb-6 flex flex-col gap-3 sm:flex-row">
        <select name="status" defaultValue={status} className="rounded-2xl border border-line bg-black/20 px-4 py-3 text-white">
          <option value="">{zhCN.admin.statusFilterAll}</option>
          <option value="ISSUED">{zhCN.admin.statusFilterIssued}</option>
          <option value="REDEEMED">{zhCN.admin.statusFilterRedeemed}</option>
          <option value="VOID">{zhCN.admin.statusFilterVoid}</option>
        </select>
        <input name="code" defaultValue={code} placeholder={zhCN.admin.codeSearchPlaceholder} className="min-w-0 flex-1 rounded-2xl border border-line bg-black/20 px-4 py-3 text-white" />
        <button className="rounded-2xl border border-line px-4 py-3 text-white">{zhCN.admin.filterButton}</button>
      </form>
      <AdminCodesClient initialCodes={redeemCodes} initialNotice={initialNotice} statusFilter={status} />
    </AdminShell>
  );
}
