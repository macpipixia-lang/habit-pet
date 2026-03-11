import { RedeemCodeStatus } from "@prisma/client";
import {
  adminLogoutAction,
  saveShopItemAction,
  toggleShopItemActiveAction,
  updateRedeemCodeStatusAction,
} from "@/app/actions";
import { AdminLoginForm } from "@/components/admin-login-form";
import { Card, Pill } from "@/components/ui";
import { getAdminState } from "@/lib/data";
import { isAdminAuthenticated } from "@/lib/auth";
import { zhCN } from "@/lib/i18n/zhCN";

function getSuccessMessage(success: string | null) {
  switch (success) {
    case "login":
      return zhCN.feedback.adminLoginSuccess;
    case "logout":
      return zhCN.feedback.adminLogoutSuccess;
    case "item-saved":
      return zhCN.feedback.itemSaved;
    case "item-status-updated":
      return zhCN.feedback.itemStatusUpdated;
    case "code-updated":
      return zhCN.feedback.codeUpdated;
    default:
      return null;
  }
}

function getStatusLabel(status: RedeemCodeStatus) {
  switch (status) {
    case "ISSUED":
      return zhCN.admin.statusFilterIssued;
    case "REDEEMED":
      return zhCN.admin.statusFilterRedeemed;
    case "VOID":
      return zhCN.admin.statusFilterVoid;
  }
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const isAdmin = await isAdminAuthenticated();
  const error = typeof params.error === "string" ? params.error : null;
  const success = typeof params.success === "string" ? params.success : null;
  const statusParam =
    typeof params.status === "string" && ["ISSUED", "REDEEMED", "VOID"].includes(params.status)
      ? (params.status as RedeemCodeStatus)
      : undefined;
  const successMessage = getSuccessMessage(success);

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-xl">
        <Card>
          <Pill className="text-accent">{zhCN.admin.title}</Pill>
          <h1 className="mt-4 text-3xl font-semibold text-white">{zhCN.admin.loginTitle}</h1>
          <p className="mt-3 text-sm leading-7 text-mist">{zhCN.admin.loginDescription}</p>
          {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
          {successMessage ? <p className="mt-4 text-sm text-success">{successMessage}</p> : null}
          <div className="mt-6">
            <AdminLoginForm />
          </div>
        </Card>
      </div>
    );
  }

  const adminState = await getAdminState(statusParam);

  return (
    <div className="space-y-6">
      {error ? (
        <Card className="border-danger/40 bg-danger/10 text-sm text-red-100">{error}</Card>
      ) : successMessage ? (
        <Card className="border-success/40 bg-emerald-500/10 text-sm text-emerald-100">{successMessage}</Card>
      ) : null}

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Pill className="text-accent">{zhCN.admin.title}</Pill>
            <h1 className="mt-4 text-3xl font-semibold text-white">{zhCN.admin.title}</h1>
            <p className="mt-3 text-sm leading-7 text-mist">{zhCN.admin.description}</p>
          </div>
          <form action={adminLogoutAction}>
            <button className="rounded-2xl border border-line px-4 py-3 text-white">
              {zhCN.admin.logoutButton}
            </button>
          </form>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <Card>
            <Pill className="text-accent">{zhCN.admin.createItemTitle}</Pill>
            <h2 className="mt-4 text-2xl font-semibold text-white">{zhCN.admin.itemsTitle}</h2>
            <p className="mt-3 text-sm leading-7 text-mist">{zhCN.admin.itemsDescription}</p>
            <form action={saveShopItemAction} className="mt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-mist" htmlFor="slug">
                  {zhCN.admin.slugLabel}
                </label>
                <input id="slug" name="slug" className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-mist" htmlFor="nameZh">
                  {zhCN.admin.nameLabel}
                </label>
                <input id="nameZh" name="nameZh" className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-mist" htmlFor="descriptionZh">
                  {zhCN.admin.descriptionLabel}
                </label>
                <textarea
                  id="descriptionZh"
                  name="descriptionZh"
                  className="min-h-28 w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm text-mist" htmlFor="kind">
                    {zhCN.admin.kindLabel}
                  </label>
                  <select id="kind" name="kind" className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white">
                    <option value="MAKEUP_CARD">{zhCN.shop.kindMakeupCard}</option>
                    <option value="COUPON">{zhCN.shop.kindCoupon}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-mist" htmlFor="priceBase">
                    {zhCN.admin.priceBaseLabel}
                  </label>
                  <input id="priceBase" name="priceBase" type="number" min="0" className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-mist" htmlFor="priceStep">
                    {zhCN.admin.priceStepLabel}
                  </label>
                  <input id="priceStep" name="priceStep" type="number" min="0" className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white" required />
                </div>
              </div>
              <button className="w-full rounded-2xl bg-accent px-4 py-3 font-semibold text-slate-950">
                {zhCN.admin.saveItemButton}
              </button>
            </form>
          </Card>

          <Card>
            <Pill className="text-accentWarm">{zhCN.admin.itemsBadge}</Pill>
            <h2 className="mt-4 text-2xl font-semibold text-white">{zhCN.admin.itemsTitle}</h2>
            <div className="mt-6 space-y-3">
              {adminState.items.length === 0 ? (
                <p className="text-sm text-mist">{zhCN.admin.emptyItems}</p>
              ) : (
                adminState.items.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-line bg-black/20 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-white">{item.nameZh}</p>
                        <p className="mt-1 text-sm text-mist">{item.slug}</p>
                      </div>
                      <Pill>{item.isActive ? zhCN.admin.activateButton : zhCN.admin.deactivateButton}</Pill>
                    </div>
                    <p className="mt-3 text-sm text-mist">{item.descriptionZh}</p>
                    <p className="mt-3 text-sm text-mist">
                      {item.kind} · {item.priceBase} / +{item.priceStep}
                    </p>
                    <form action={toggleShopItemActiveAction} className="mt-4">
                      <input type="hidden" name="itemId" value={item.id} />
                      <button className="rounded-2xl border border-line px-4 py-2 text-white">
                        {item.isActive ? zhCN.admin.deactivateButton : zhCN.admin.activateButton}
                      </button>
                    </form>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <Card>
          <Pill className="text-accent">{zhCN.admin.codesBadge}</Pill>
          <h2 className="mt-4 text-2xl font-semibold text-white">{zhCN.admin.codesTitle}</h2>
          <p className="mt-3 text-sm leading-7 text-mist">{zhCN.admin.codesDescription}</p>
          <form className="mt-6 flex flex-col gap-3 sm:flex-row">
            <select
              name="status"
              defaultValue={statusParam ?? ""}
              className="rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
            >
              <option value="">{zhCN.admin.statusFilterAll}</option>
              <option value="ISSUED">{zhCN.admin.statusFilterIssued}</option>
              <option value="REDEEMED">{zhCN.admin.statusFilterRedeemed}</option>
              <option value="VOID">{zhCN.admin.statusFilterVoid}</option>
            </select>
            <button className="rounded-2xl border border-line px-4 py-3 text-white">{zhCN.admin.filterButton}</button>
          </form>
          <div className="mt-6 space-y-3">
            {adminState.redeemCodes.length === 0 ? (
              <p className="text-sm text-mist">{zhCN.admin.emptyCodes}</p>
            ) : (
              adminState.redeemCodes.map((code) => (
                <div key={code.id} className="rounded-2xl border border-line bg-black/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{code.item.nameZh}</p>
                      <p className="mt-1 break-all text-sm text-mist">{code.id}</p>
                    </div>
                    <Pill>{getStatusLabel(code.status)}</Pill>
                  </div>
                  <p className="mt-3 text-sm text-mist">用户：{code.user.username}</p>
                  <p className="mt-1 text-sm text-mist">发放时间：{code.issuedAt.toLocaleString("zh-CN", { hour12: false })}</p>
                  {code.redeemedAt ? (
                    <p className="mt-1 text-sm text-mist">处理时间：{code.redeemedAt.toLocaleString("zh-CN", { hour12: false })}</p>
                  ) : null}
                  {code.status === "ISSUED" ? (
                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      <form action={updateRedeemCodeStatusAction} className="space-y-3">
                        <input type="hidden" name="code" value={code.id} />
                        <input type="hidden" name="status" value="REDEEMED" />
                        <label className="block text-sm text-mist">
                          {zhCN.admin.noteLabel}
                          <input
                            name="adminNote"
                            defaultValue={code.adminNote ?? ""}
                            className="mt-2 w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
                          />
                        </label>
                        <button className="w-full rounded-2xl bg-accent px-4 py-3 font-semibold text-slate-950">
                          {zhCN.admin.redeemButton}
                        </button>
                      </form>
                      <form action={updateRedeemCodeStatusAction} className="space-y-3">
                        <input type="hidden" name="code" value={code.id} />
                        <input type="hidden" name="status" value="VOID" />
                        <label className="block text-sm text-mist">
                          {zhCN.admin.noteLabel}
                          <input
                            name="adminNote"
                            defaultValue={code.adminNote ?? ""}
                            className="mt-2 w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
                          />
                        </label>
                        <button className="w-full rounded-2xl border border-line px-4 py-3 text-white">
                          {zhCN.admin.voidButton}
                        </button>
                      </form>
                    </div>
                  ) : code.adminNote ? (
                    <p className="mt-3 text-sm text-mist">
                      {zhCN.admin.noteLabel}：{code.adminNote}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
