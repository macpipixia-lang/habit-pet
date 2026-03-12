import { updateRedeemCodeStatusAction } from "@/app/actions";
import { AdminFeedback } from "@/app/admin/_components/admin-feedback";
import { getAdminPageParams } from "@/app/admin/_lib";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { AdminShell } from "@/components/admin-shell";
import { Card, Pill } from "@/components/ui";
import { getAdminSuccessMessage, getRedeemCodeStatusLabel } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import { getAdminRedeemCodes } from "@/lib/data";
import { zhCN } from "@/lib/i18n/zhCN";

export default async function AdminCodesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const { error, success, status, code } = await getAdminPageParams(searchParams);
  const successMessage = getAdminSuccessMessage(success);
  const redeemCodes = await getAdminRedeemCodes(status, code || undefined);

  return (
    <AdminShell activePath="/admin/codes" title={zhCN.admin.codesTitle} description={zhCN.admin.codesDescription}>
      <AdminFeedback error={error} successMessage={successMessage} />
      <Card>
        <Pill className="text-accent">{zhCN.admin.codesBadge}</Pill>
        <h2 className="mt-4 text-2xl font-semibold text-white">{zhCN.admin.codesTitle}</h2>
        <p className="mt-3 text-sm leading-7 text-mist">{zhCN.admin.codesDescription}</p>
        <form className="mt-6 flex flex-col gap-3 sm:flex-row">
          <select
            name="status"
            defaultValue={status ?? ""}
            className="rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
          >
            <option value="">{zhCN.admin.statusFilterAll}</option>
            <option value="ISSUED">{zhCN.admin.statusFilterIssued}</option>
            <option value="REDEEMED">{zhCN.admin.statusFilterRedeemed}</option>
            <option value="VOID">{zhCN.admin.statusFilterVoid}</option>
          </select>
          <input
            name="code"
            defaultValue={code}
            placeholder={zhCN.admin.codeSearchPlaceholder}
            className="min-w-0 flex-1 rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
          />
          <button className="rounded-2xl border border-line px-4 py-3 text-white">{zhCN.admin.filterButton}</button>
        </form>
        <div className="mt-6 space-y-3">
          {redeemCodes.length === 0 ? (
            <p className="text-sm text-mist">{zhCN.admin.emptyCodes}</p>
          ) : (
            redeemCodes.map((redeemCode) => (
              <div key={redeemCode.id} className="rounded-2xl border border-line bg-black/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{redeemCode.item.nameZh}</p>
                    <p className="mt-1 break-all text-sm text-mist">{redeemCode.id}</p>
                  </div>
                  <Pill>{getRedeemCodeStatusLabel(redeemCode.status)}</Pill>
                </div>
                <p className="mt-3 text-sm text-mist">用户：{redeemCode.user.username}</p>
                <p className="mt-1 text-sm text-mist">
                  发放时间：{redeemCode.issuedAt.toLocaleString("zh-CN", { hour12: false })}
                </p>
                {redeemCode.redeemedAt ? (
                  <p className="mt-1 text-sm text-mist">
                    处理时间：{redeemCode.redeemedAt.toLocaleString("zh-CN", { hour12: false })}
                  </p>
                ) : null}
                {redeemCode.status === "ISSUED" ? (
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <form action={updateRedeemCodeStatusAction} className="space-y-3">
                      <input type="hidden" name="code" value={redeemCode.id} />
                      <input type="hidden" name="status" value="REDEEMED" />
                      <input type="hidden" name="redirectTo" value="/admin/codes" />
                      <label className="block text-sm text-mist">
                        {zhCN.admin.noteLabel}
                        <input
                          name="adminNote"
                          defaultValue={redeemCode.adminNote ?? ""}
                          className="mt-2 w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
                        />
                      </label>
                      <ConfirmSubmitButton
                        confirmMessage={zhCN.admin.redeemConfirm}
                        pendingLabel={zhCN.auth.submitting}
                        className="w-full rounded-2xl bg-accent px-4 py-3 font-semibold text-slate-950 disabled:opacity-70"
                      >
                        {zhCN.admin.redeemButton}
                      </ConfirmSubmitButton>
                    </form>
                    <form action={updateRedeemCodeStatusAction} className="space-y-3">
                      <input type="hidden" name="code" value={redeemCode.id} />
                      <input type="hidden" name="status" value="VOID" />
                      <input type="hidden" name="redirectTo" value="/admin/codes" />
                      <label className="block text-sm text-mist">
                        {zhCN.admin.noteLabel}
                        <input
                          name="adminNote"
                          defaultValue={redeemCode.adminNote ?? ""}
                          className="mt-2 w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
                        />
                      </label>
                      <ConfirmSubmitButton
                        confirmMessage={zhCN.admin.voidConfirm}
                        pendingLabel={zhCN.auth.submitting}
                        className="w-full rounded-2xl border border-line px-4 py-3 text-white disabled:opacity-70"
                      >
                        {zhCN.admin.voidButton}
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                ) : redeemCode.adminNote ? (
                  <p className="mt-3 text-sm text-mist">
                    {zhCN.admin.noteLabel}：{redeemCode.adminNote}
                  </p>
                ) : null}
              </div>
            ))
          )}
        </div>
      </Card>
    </AdminShell>
  );
}
