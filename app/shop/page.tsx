import { purchaseShopItemAction } from "@/app/actions";
import { CouponCodeModal } from "@/components/coupon-code-modal";
import { Card, Pill } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getDashboardState } from "@/lib/data";
import { formatText, zhCN } from "@/lib/i18n/zhCN";

function getKindLabel(kind: string) {
  return kind === "MAKEUP_CARD" ? zhCN.shop.kindMakeupCard : zhCN.shop.kindCoupon;
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const state = await getDashboardState(user.id);
  const profile = state.user.profile!;
  const error = typeof params.error === "string" ? params.error : null;
  const success = typeof params.success === "string" ? params.success : null;
  const couponCode = typeof params.code === "string" ? params.code : null;
  const couponItemName = typeof params.item === "string" ? params.item : zhCN.shop.kindCoupon;
  const successMessage =
    success === "coupon-purchased" ? zhCN.feedback.itemPurchased : success ? zhCN.feedback.makeupPurchased : null;

  return (
    <div className="space-y-6">
      {couponCode ? <CouponCodeModal code={couponCode} itemName={couponItemName} /> : null}
      {error ? (
        <Card className="border-danger/40 bg-danger/10 text-sm text-red-100">{error}</Card>
      ) : successMessage ? (
        <Card className="border-success/40 bg-emerald-500/10 text-sm text-emerald-100">{successMessage}</Card>
      ) : null}
      <Card>
        <Pill className="text-accent">{zhCN.shop.badge}</Pill>
        <h1 className="mt-4 text-3xl font-semibold text-white">{zhCN.shop.title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-mist">{zhCN.shop.description}</p>
        <div className="mt-6 rounded-2xl border border-line bg-black/20 p-4">
          <p className="text-sm text-mist">{zhCN.shop.yourPoints}</p>
          <p className="mt-2 text-2xl text-white">{profile.points}</p>
        </div>
      </Card>

      {state.shopItems.length === 0 ? (
        <Card className="text-sm text-mist">{zhCN.shop.activeItemsEmpty}</Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {state.shopItems.map((item) => (
            <Card key={item.id}>
              <div className="flex items-center justify-between gap-4">
                <Pill className="text-accentWarm">{getKindLabel(item.kind)}</Pill>
                <Pill>{formatText(zhCN.shop.priceRule, { base: item.priceBase, count: item.purchaseCount, step: item.priceStep })}</Pill>
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-white">{item.nameZh}</h2>
              <p className="mt-3 text-sm leading-7 text-mist">{item.descriptionZh}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-line bg-black/20 p-4">
                  <p className="text-sm text-mist">{zhCN.shop.currentPrice}</p>
                  <p className="mt-2 text-xl text-white">{item.currentPrice}</p>
                </div>
                <div className="rounded-2xl border border-line bg-black/20 p-4">
                  <p className="text-sm text-mist">{zhCN.shop.owned}</p>
                  <p className="mt-2 text-xl text-white">
                    {item.kind === "MAKEUP_CARD" ? profile.makeupCards : item.purchaseCount}
                  </p>
                </div>
                <div className="rounded-2xl border border-line bg-black/20 p-4">
                  <p className="text-sm text-mist">Slug</p>
                  <p className="mt-2 text-sm text-white">{item.slug}</p>
                </div>
              </div>
              <form action={purchaseShopItemAction} className="mt-6">
                <input type="hidden" name="itemId" value={item.id} />
                <button className="rounded-2xl bg-accent px-5 py-3 font-semibold text-slate-950">
                  {item.kind === "MAKEUP_CARD" ? zhCN.shop.buyButton : zhCN.shop.buyButtonGeneric}
                </button>
              </form>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
