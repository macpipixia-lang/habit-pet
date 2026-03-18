"use client";

import { useState } from "react";
import { Card, Pill } from "@/components/ui";
import { zhCN } from "@/lib/i18n/zhCN";
import { AdminNoticeCard, postAdminJson, useAdminNotice } from "@/app/admin/_components/admin-client";

type AdminItem = {
  id: string;
  slug: string;
  nameZh: string;
  descriptionZh: string;
  kind: "MAKEUP_CARD" | "COUPON" | "PET_EGG" | "PET_SKIN";
  priceBase: number;
  priceStep: number;
  isActive: boolean;
};

export function AdminItemsClient({
  initialItems,
  initialNotice,
}: {
  initialItems: AdminItem[];
  initialNotice: { type: "error" | "success"; text: string } | null;
}) {
  const [items, setItems] = useState(initialItems);
  const { notify } = useAdminNotice(initialNotice);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  async function handleSave(formData: FormData, form?: HTMLFormElement | null) {
    const payload = Object.fromEntries(formData.entries());
    const pendingId = String(payload.id || "new");
    setPendingKey(`save:${pendingId}`);

    try {
      const result = await postAdminJson<AdminItem>("/api/admin/items/save", payload);
      const savedItem = result.data!;

      setItems((current) => {
        const next = current.some((item) => item.id === savedItem.id)
          ? current.map((item) => (item.id === savedItem.id ? savedItem : item))
          : [savedItem, ...current];

        return next.sort((left, right) => Number(right.isActive) - Number(left.isActive));
      });

      if (form && !savedItem.id) {
        form.reset();
      }

      if (form && !payload.id) {
        form.reset();
      }

      notify({ type: "success", text: result.message ?? zhCN.feedback.itemSaved });
    } catch (error) {
      notify({ type: "error", text: error instanceof Error ? error.message : zhCN.feedback.fallbackError });
    } finally {
      setPendingKey(null);
    }
  }

  async function handleToggle(itemId: string) {
    const previousItems = items;
    setPendingKey(`toggle:${itemId}`);
    setItems((current) => current.map((item) => (item.id === itemId ? { ...item, isActive: !item.isActive } : item)));

    try {
      const result = await postAdminJson<AdminItem>("/api/admin/items/toggle", { itemId });
      const updated = result.data!;
      setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      notify({ type: "success", text: result.message ?? zhCN.feedback.itemStatusUpdated });
    } catch (error) {
      setItems(previousItems);
      notify({ type: "error", text: error instanceof Error ? error.message : zhCN.feedback.fallbackError });
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <Pill className="text-accent">{zhCN.admin.createItemTitle}</Pill>
          <h2 className="mt-4 text-2xl font-semibold text-white">{zhCN.admin.createItemTitle}</h2>
          <p className="mt-3 text-sm leading-7 text-mist">{zhCN.admin.itemsDescription}</p>
          <form
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSave(new FormData(event.currentTarget), event.currentTarget);
            }}
          >
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
              <textarea id="descriptionZh" name="descriptionZh" className="min-h-28 w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white" required />
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
              <select id="create-isActive" name="isActive" defaultValue="true" className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white">
                <option value="true">{zhCN.admin.activeOption}</option>
                <option value="false">{zhCN.admin.inactiveOption}</option>
              </select>
            </div>
            <button disabled={pendingKey === "save:new"} className="w-full rounded-2xl bg-accent px-4 py-3 font-semibold text-slate-950 disabled:opacity-70">
              {pendingKey === "save:new" ? zhCN.auth.submitting : zhCN.admin.saveItemButton}
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
                  <form
                    className="mt-4 space-y-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void handleSave(new FormData(event.currentTarget));
                    }}
                  >
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="kind" value={item.kind} />
                    <div className="space-y-2">
                      <label className="text-sm text-mist" htmlFor={`slug-${item.id}`}>
                        {zhCN.admin.slugLabel}
                      </label>
                      <input id={`slug-${item.id}`} name="slug" defaultValue={item.slug} className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-mist" htmlFor={`nameZh-${item.id}`}>
                        {zhCN.admin.nameLabel}
                      </label>
                      <input id={`nameZh-${item.id}`} name="nameZh" defaultValue={item.nameZh} className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-mist" htmlFor={`descriptionZh-${item.id}`}>
                        {zhCN.admin.descriptionLabel}
                      </label>
                      <textarea id={`descriptionZh-${item.id}`} name="descriptionZh" defaultValue={item.descriptionZh} className="min-h-24 w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white" required />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-4">
                      <div className="space-y-2">
                        <label className="text-sm text-mist" htmlFor={`kind-${item.id}`}>
                          {zhCN.admin.kindLabel}
                        </label>
                        <select id={`kind-${item.id}`} defaultValue={item.kind} disabled className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white disabled:cursor-not-allowed disabled:opacity-70">
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
                        <input id={`priceBase-${item.id}`} name="priceBase" type="number" min="0" defaultValue={item.priceBase} className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white" required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-mist" htmlFor={`priceStep-${item.id}`}>
                          {zhCN.admin.priceStepLabel}
                        </label>
                        <input id={`priceStep-${item.id}`} name="priceStep" type="number" min="0" defaultValue={item.priceStep} className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white" required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-mist" htmlFor={`isActive-${item.id}`}>
                          {zhCN.admin.activeLabel}
                        </label>
                        <select id={`isActive-${item.id}`} name="isActive" defaultValue={String(item.isActive)} className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white">
                          <option value="true">{zhCN.admin.activeOption}</option>
                          <option value="false">{zhCN.admin.inactiveOption}</option>
                        </select>
                      </div>
                    </div>
                    <button disabled={pendingKey === `save:${item.id}`} className="rounded-2xl bg-accent px-4 py-3 font-semibold text-slate-950 disabled:opacity-70">
                      {pendingKey === `save:${item.id}` ? zhCN.auth.submitting : zhCN.admin.updateItemButton}
                    </button>
                  </form>
                  <div className="mt-3">
                    <button disabled={Boolean(pendingKey)} onClick={() => void handleToggle(item.id)} className="rounded-2xl border border-line px-4 py-2 text-white disabled:opacity-70">
                      {pendingKey === `toggle:${item.id}` ? zhCN.auth.submitting : item.isActive ? zhCN.admin.deactivateButton : zhCN.admin.activateButton}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
