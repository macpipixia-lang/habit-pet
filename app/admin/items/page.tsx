import {
  saveShopItemAction,
  toggleShopItemActiveAction,
} from "@/app/actions";
import { AdminFeedback } from "@/app/admin/_components/admin-feedback";
import { getAdminPageParams } from "@/app/admin/_lib";
import { AdminShell } from "@/components/admin-shell";
import { Card, Pill } from "@/components/ui";
import { getAdminSuccessMessage } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import { getAdminItems } from "@/lib/data";
import { zhCN } from "@/lib/i18n/zhCN";

export default async function AdminItemsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const { error, success } = await getAdminPageParams(searchParams);
  const successMessage = getAdminSuccessMessage(success);
  const items = await getAdminItems();

  return (
    <AdminShell activePath="/admin/items" title={zhCN.admin.itemsTitle} description={zhCN.admin.itemsDescription}>
      <AdminFeedback error={error} successMessage={successMessage} />
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <Pill className="text-accent">{zhCN.admin.createItemTitle}</Pill>
          <h2 className="mt-4 text-2xl font-semibold text-white">{zhCN.admin.createItemTitle}</h2>
          <p className="mt-3 text-sm leading-7 text-mist">{zhCN.admin.itemsDescription}</p>
          <form action={saveShopItemAction} className="mt-6 space-y-4">
            <input type="hidden" name="redirectTo" value="/admin/items" />
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
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm text-mist" htmlFor="kind">
                  {zhCN.admin.kindLabel}
                </label>
                <select id="kind" name="kind" className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white">
                  <option value="MAKEUP_CARD">{zhCN.shop.kindMakeupCard}</option>
                  <option value="COUPON">{zhCN.shop.kindCoupon}</option>
                  <option value="PET_EGG">{zhCN.shop.kindPetEgg}</option>
                  <option value="PET_SKIN">{zhCN.shop.kindPetSkin}</option>
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
            <div className="space-y-2">
              <label className="text-sm text-mist" htmlFor="create-isActive">
                {zhCN.admin.activeLabel}
              </label>
              <select
                id="create-isActive"
                name="isActive"
                defaultValue="true"
                className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
              >
                <option value="true">{zhCN.admin.activeOption}</option>
                <option value="false">{zhCN.admin.inactiveOption}</option>
              </select>
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
            {items.length === 0 ? (
              <p className="text-sm text-mist">{zhCN.admin.emptyItems}</p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="rounded-2xl border border-line bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">{item.nameZh}</p>
                      <p className="mt-1 text-sm text-mist">{item.slug}</p>
                    </div>
                    <Pill>{item.isActive ? zhCN.admin.activeOption : zhCN.admin.inactiveOption}</Pill>
                  </div>
                  <p className="mt-3 text-sm text-mist">{item.descriptionZh}</p>
                  <p className="mt-3 text-sm text-mist">{item.kind}</p>
                  <form action={saveShopItemAction} className="mt-4 space-y-4">
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="kind" value={item.kind} />
                    <input type="hidden" name="redirectTo" value="/admin/items" />
                    <div className="space-y-2">
                      <label className="text-sm text-mist" htmlFor={`slug-${item.id}`}>
                        {zhCN.admin.slugLabel}
                      </label>
                      <input
                        id={`slug-${item.id}`}
                        name="slug"
                        defaultValue={item.slug}
                        className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-mist" htmlFor={`nameZh-${item.id}`}>
                        {zhCN.admin.nameLabel}
                      </label>
                      <input
                        id={`nameZh-${item.id}`}
                        name="nameZh"
                        defaultValue={item.nameZh}
                        className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-mist" htmlFor={`descriptionZh-${item.id}`}>
                        {zhCN.admin.descriptionLabel}
                      </label>
                      <textarea
                        id={`descriptionZh-${item.id}`}
                        name="descriptionZh"
                        defaultValue={item.descriptionZh}
                        className="min-h-24 w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
                        required
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-4">
                      <div className="space-y-2">
                        <label className="text-sm text-mist" htmlFor={`kind-${item.id}`}>
                          {zhCN.admin.kindLabel}
                        </label>
                        <select
                          id={`kind-${item.id}`}
                          defaultValue={item.kind}
                          disabled
                          className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          <option value="MAKEUP_CARD">{zhCN.shop.kindMakeupCard}</option>
                          <option value="COUPON">{zhCN.shop.kindCoupon}</option>
                          <option value="PET_EGG">{zhCN.shop.kindPetEgg}</option>
                          <option value="PET_SKIN">{zhCN.shop.kindPetSkin}</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-mist" htmlFor={`priceBase-${item.id}`}>
                          {zhCN.admin.priceBaseLabel}
                        </label>
                        <input
                          id={`priceBase-${item.id}`}
                          name="priceBase"
                          type="number"
                          min="0"
                          defaultValue={item.priceBase}
                          className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-mist" htmlFor={`priceStep-${item.id}`}>
                          {zhCN.admin.priceStepLabel}
                        </label>
                        <input
                          id={`priceStep-${item.id}`}
                          name="priceStep"
                          type="number"
                          min="0"
                          defaultValue={item.priceStep}
                          className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-mist" htmlFor={`isActive-${item.id}`}>
                          {zhCN.admin.activeLabel}
                        </label>
                        <select
                          id={`isActive-${item.id}`}
                          name="isActive"
                          defaultValue={String(item.isActive)}
                          className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
                        >
                          <option value="true">{zhCN.admin.activeOption}</option>
                          <option value="false">{zhCN.admin.inactiveOption}</option>
                        </select>
                      </div>
                    </div>
                    <button className="rounded-2xl bg-accent px-4 py-3 font-semibold text-slate-950">
                      {zhCN.admin.updateItemButton}
                    </button>
                  </form>
                  <form action={toggleShopItemActiveAction} className="mt-3">
                    <input type="hidden" name="itemId" value={item.id} />
                    <input type="hidden" name="redirectTo" value="/admin/items" />
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
    </AdminShell>
  );
}
