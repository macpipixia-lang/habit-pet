import { requireUser } from "@/lib/auth";
import { getDashboardState } from "@/lib/data";
import { ShopClient } from "./shop-client";

export default async function ShopPage({
  searchParams: _searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const state = await getDashboardState(user.id);
  const profile = state.user.profile!;

  return <ShopClient initialItems={state.shopItems} points={profile.points} makeupCards={profile.makeupCards} />;
}
