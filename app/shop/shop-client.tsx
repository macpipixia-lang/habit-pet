"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CouponCodeModal } from "@/components/coupon-code-modal";
import { useToast } from "@/components/toast-provider";
import { Card, Pill } from "@/components/ui";
import { postJson } from "@/lib/client-api";
import { formatText, zhCN } from "@/lib/i18n/zhCN";
import { getPetVisual } from "@/lib/pets";

type ShopItem = {
  id: string;
  slug: string;
  kind: "MAKEUP_CARD" | "COUPON" | "PET_EGG" | "PET_SKIN";
  nameZh: string;
  descriptionZh: string;
  priceBase: number;
  priceStep: number;
  purchaseCount: number;
  currentPrice: number;
  ownsSkin?: boolean;
  ownsRequiredSpecies?: boolean;
  petSkin?: {
    imageKey: string;
    species?: {
      nameZh: string;
    } | null;
  } | null;
};

function getKindLabel(kind: string) {
  if (kind === "MAKEUP_CARD") return zhCN.shop.kindMakeupCard;
  if (kind === "PET_EGG") return zhCN.shop.kindPetEgg;
  if (kind === "PET_SKIN") return zhCN.shop.kindPetSkin;
  return zhCN.shop.kindCoupon;
}

export function ShopClient({
  initialItems,
  points,
  makeupCards,
}: Readonly<{
  initialItems: ShopItem[];
  points: number;
  makeupCards: number;
}>) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [coupon, setCoupon] = useState<{ code: string; itemName: string } | null>(null);

  async function handlePurchase(itemId: string) {
    if (pendingItemId) {
      return;
    }

    setPendingItemId(itemId);

    try {
      const result = await postJson<{
        redeemCode?: { id: string } | null;
        purchase?: { item?: { nameZh: string } };
      }>("/api/shop/purchase", { itemId });
      showToast("success", result.message ?? zhCN.feedback.itemPurchased);

      if (result.data?.redeemCode?.id) {
        setCoupon({
          code: result.data.redeemCode.id,
          itemName: result.data.purchase?.item?.nameZh ?? zhCN.shop.kindCoupon,
        });
      }

      router.refresh();
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : zhCN.feedback.fallbackError);
    } finally {
      setPendingItemId(null);
    }
  }

  return (
    <div className="space-y-6">
      {coupon ? <CouponCodeModal code={coupon.code} itemName={coupon.itemName} /> : null}
      <Card>
        <Pill className="text-accent">{zhCN.shop.badge}</Pill>
        <h1 className="mt-4 text-3xl font-semibold text-ink">{zhCN.shop.title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-mist">{zhCN.shop.description}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <div className="min-w-48 rounded-2xl border border-line bg-panelAlt/70 p-4">
            <p className="text-sm text-mist">{zhCN.shop.yourPoints}</p>
            <p className="mt-2 text-2xl text-ink">{points}</p>
          </div>
          <Link href="/pokedex" className="inline-flex items-center rounded-2xl border border-line px-5 py-3 text-sm text-ink transition hover:border-accent/35">
            {zhCN.shop.viewPokedex}
          </Link>
        </div>
      </Card>

      {initialItems.length === 0 ? (
        <Card className="text-sm text-mist">{zhCN.shop.activeItemsEmpty}</Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {initialItems.map((item) => (
            <Card key={item.id}>
              {item.kind === "PET_SKIN" && item.petSkin ? (
                <div className={`mb-6 rounded-[2rem] border border-line bg-gradient-to-br ${getPetVisual(item.petSkin.imageKey).accent} p-5`}>
                  <div
                    className={`flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-line text-4xl ${getPetVisual(
                      item.petSkin.imageKey,
                    ).className}`}
                  >
                    {getPetVisual(item.petSkin.imageKey).emoji}
                  </div>
                  <p className="mt-4 text-sm text-mist">
                    {formatText(zhCN.shop.petSkinSpecies, {
                      name: item.petSkin.species?.nameZh ?? zhCN.pet.skinDefault,
                    })}
                  </p>
                  <p className="mt-2 text-sm text-mist">
                    {item.ownsRequiredSpecies ? zhCN.shop.petSkinSpeciesOwned : zhCN.shop.petSkinSpeciesMissing}
                  </p>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-4">
                <Pill className="text-accentWarm">{getKindLabel(item.kind)}</Pill>
                <Pill>{formatText(zhCN.shop.priceRule, { base: item.priceBase, count: item.purchaseCount, step: item.priceStep })}</Pill>
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-ink">{item.nameZh}</h2>
              <p className="mt-3 text-sm leading-7 text-mist">{item.descriptionZh}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-line bg-panelAlt/70 p-4">
                  <p className="text-sm text-mist">{zhCN.shop.currentPrice}</p>
                  <p className="mt-2 text-xl text-ink">{item.currentPrice}</p>
                </div>
                <div className="rounded-2xl border border-line bg-panelAlt/70 p-4">
                  <p className="text-sm text-mist">{zhCN.shop.owned}</p>
                  <p className="mt-2 text-xl text-ink">
                    {item.kind === "MAKEUP_CARD" ? makeupCards : item.kind === "PET_SKIN" ? Number(item.ownsSkin) : item.purchaseCount}
                  </p>
                </div>
                <div className="rounded-2xl border border-line bg-panelAlt/70 p-4">
                  <p className="text-sm text-mist">Slug</p>
                  <p className="mt-2 text-sm text-ink">{item.slug}</p>
                </div>
              </div>
              {item.kind === "PET_SKIN" && !item.ownsRequiredSpecies ? (
                <p className="mt-4 text-sm text-mist">{zhCN.shop.petSkinSpeciesRequiredHint}</p>
              ) : null}
              {item.kind === "PET_EGG" ? (
                <Link href="/shop/pet-egg" className="mt-6 inline-flex rounded-2xl bg-accent px-5 py-3 font-semibold text-night transition hover:brightness-105">
                  {zhCN.shop.choosePetButton}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => void handlePurchase(item.id)}
                  disabled={pendingItemId === item.id || (item.kind === "PET_SKIN" && (item.ownsSkin || !item.ownsRequiredSpecies))}
                  className="mt-6 rounded-2xl bg-accent px-5 py-3 font-semibold text-night disabled:cursor-not-allowed disabled:bg-panelAlt disabled:text-mist"
                >
                  {item.kind === "PET_SKIN" && item.ownsSkin
                    ? zhCN.shop.petSkinOwned
                    : item.kind === "PET_SKIN" && !item.ownsRequiredSpecies
                      ? zhCN.shop.petSkinSpeciesRequiredButton
                      : pendingItemId === item.id
                        ? zhCN.auth.submitting
                        : item.kind === "MAKEUP_CARD"
                          ? zhCN.shop.buyButton
                          : zhCN.shop.buyButtonGeneric}
                </button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
