import { buyMakeupCardAction } from "@/app/actions";
import { Card, Pill } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getDashboardState } from "@/lib/data";

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

  return (
    <div className="space-y-6">
      {error ? (
        <Card className="border-danger/40 bg-danger/10 text-sm text-red-100">{error}</Card>
      ) : success ? (
        <Card className="border-success/40 bg-emerald-500/10 text-sm text-emerald-100">Makeup card purchased.</Card>
      ) : null}
      <Card>
        <Pill className="text-accent">Shop</Pill>
        <h1 className="mt-4 text-3xl font-semibold text-white">Reward inventory</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-mist">
          MVP supports makeup cards only. Real-world items will later plug into the same shop pipeline as redeem-only
          coupon codes, without address collection.
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <Pill className="text-accentWarm">Available now</Pill>
          <h2 className="mt-4 text-2xl font-semibold text-white">Makeup card</h2>
          <p className="mt-3 text-sm leading-7 text-mist">
            Restores the streak for yesterday only. Price rises by 1 point every time you buy one.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-line bg-black/20 p-4">
              <p className="text-sm text-mist">Your points</p>
              <p className="mt-2 text-xl text-white">{profile.points}</p>
            </div>
            <div className="rounded-2xl border border-line bg-black/20 p-4">
              <p className="text-sm text-mist">Owned</p>
              <p className="mt-2 text-xl text-white">{profile.makeupCards}</p>
            </div>
            <div className="rounded-2xl border border-line bg-black/20 p-4">
              <p className="text-sm text-mist">Current price</p>
              <p className="mt-2 text-xl text-white">{state.nextShopPrice}</p>
            </div>
          </div>
          <form action={buyMakeupCardAction} className="mt-6">
            <button className="rounded-2xl bg-accent px-5 py-3 font-semibold text-slate-950">
              Redeem makeup card
            </button>
          </form>
        </Card>

        <Card>
          <Pill className="text-accent">Future hook</Pill>
          <h2 className="mt-4 text-2xl font-semibold text-white">Reality item placeholder</h2>
          <p className="mt-3 text-sm leading-7 text-mist">
            This panel reserves the shop layout for future coupon-code items. The data model can be extended with item
            catalogs and code pools when non-MVP rewards are introduced.
          </p>
          <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-black/10 p-5 text-sm text-mist">
            Reserved for a future redeem-only coupon/code item.
          </div>
        </Card>
      </div>
    </div>
  );
}
