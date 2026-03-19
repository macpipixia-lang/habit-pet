import Link from "next/link";
import { PokedexSpeciesCard, getRarityOrder } from "@/components/pokedex-ui";
import { Card, Pill } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getPokedexState } from "@/lib/data";
import { formatText, zhCN } from "@/lib/i18n/zhCN";

type OwnershipFilter = "all" | "owned" | "unowned";
type SortMode = "rarity" | "name";

function getSingleParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

export default async function PokedexPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const state = await getPokedexState(user.id);

  if (state.species.length === 0) {
    return <Card className="text-sm text-mist">{zhCN.pokedex.empty}</Card>;
  }

  const filterParam = getSingleParam(params.filter);
  const sortParam = getSingleParam(params.sort);
  const query = getSingleParam(params.q).trim();
  const filter: OwnershipFilter =
    filterParam === "owned" || filterParam === "unowned" ? filterParam : "all";
  const sort: SortMode = sortParam === "name" ? "name" : "rarity";
  const queryLower = query.toLocaleLowerCase("zh-CN");

  const species = state.species
    .filter((entry) => {
      if (filter === "owned" && !entry.owned) return false;
      if (filter === "unowned" && entry.owned) return false;
      if (queryLower && !entry.nameZh.toLocaleLowerCase("zh-CN").includes(queryLower)) return false;
      return true;
    })
    .sort((left, right) => {
      if (sort === "name") {
        return left.nameZh.localeCompare(right.nameZh, "zh-CN");
      }

      const rarityDiff = getRarityOrder(left.rarity) - getRarityOrder(right.rarity);
      if (rarityDiff !== 0) return rarityDiff;
      return left.nameZh.localeCompare(right.nameZh, "zh-CN");
    });

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Pill className="text-accent">{zhCN.pokedex.badge}</Pill>
            <h1 className="mt-4 text-3xl font-semibold text-ink">{zhCN.pokedex.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-mist">{zhCN.pokedex.description}</p>
          </div>
          <div className="rounded-3xl border border-line bg-panelAlt/70 px-5 py-4">
            <p className="text-sm text-mist">{zhCN.pokedex.filterLabel}</p>
            <p className="mt-2 text-2xl font-semibold text-ink">
              {formatText(zhCN.pokedex.ownershipSummary, {
                count: String(state.ownedPets.length),
                total: String(state.species.length),
              })}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/pokedex?filter=all&sort=${sort}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
            className={`rounded-full border px-4 py-2 text-sm transition ${filter === "all" ? "border-accent bg-accent text-night" : "border-line text-ink hover:border-accent/35"}`}
          >
            {zhCN.pokedex.filterAll}
          </Link>
          <Link
            href={`/pokedex?filter=owned&sort=${sort}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
            className={`rounded-full border px-4 py-2 text-sm transition ${filter === "owned" ? "border-accent bg-accent text-night" : "border-line text-ink hover:border-accent/35"}`}
          >
            {zhCN.pokedex.filterOwned}
          </Link>
          <Link
            href={`/pokedex?filter=unowned&sort=${sort}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
            className={`rounded-full border px-4 py-2 text-sm transition ${filter === "unowned" ? "border-accent bg-accent text-night" : "border-line text-ink hover:border-accent/35"}`}
          >
            {zhCN.pokedex.filterUnowned}
          </Link>
        </div>

        <form className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr_auto_auto]">
          <label className="grid gap-2 text-sm text-mist">
            {zhCN.pokedex.searchLabel}
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder={zhCN.pokedex.searchPlaceholder}
              className="rounded-2xl border border-line bg-panelAlt/70 px-4 py-3 text-ink outline-none transition focus:border-accent"
            />
          </label>
          <label className="grid gap-2 text-sm text-mist">
            {zhCN.pokedex.sortLabel}
            <select
              name="sort"
              defaultValue={sort}
              className="rounded-2xl border border-line bg-panelAlt/70 px-4 py-3 text-ink outline-none transition focus:border-accent"
            >
              <option value="rarity">{zhCN.pokedex.sortByRarity}</option>
              <option value="name">{zhCN.pokedex.sortByName}</option>
            </select>
          </label>
          <input type="hidden" name="filter" value={filter} />
          <button className="self-end rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-night transition hover:brightness-105">
            {zhCN.pokedex.searchButton}
          </button>
          <Link href="/pokedex" className="self-end rounded-2xl border border-line px-5 py-3 text-center text-sm text-ink transition hover:border-accent/35">
            {zhCN.pokedex.resetButton}
          </Link>
        </form>
      </Card>

      {species.length === 0 ? (
        <Card className="text-sm text-mist">{zhCN.pokedex.emptyFiltered}</Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {species.map((entry) => (
            <PokedexSpeciesCard key={entry.id} species={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
