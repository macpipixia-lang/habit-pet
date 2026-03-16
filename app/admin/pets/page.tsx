import Link from "next/link";
import { savePetAction, togglePetActiveAction } from "@/app/actions";
import { AdminFeedback } from "@/app/admin/_components/admin-feedback";
import { getAdminPageParams } from "@/app/admin/_lib";
import { AdminShell } from "@/components/admin-shell";
import { Card, Pill } from "@/components/ui";
import { getAdminSuccessMessage } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import { getAdminPets } from "@/lib/data";
import { zhCN } from "@/lib/i18n/zhCN";

export default async function AdminPetsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const { error, success } = await getAdminPageParams(searchParams);
  const successMessage = getAdminSuccessMessage(success);
  const pets = await getAdminPets();

  return (
    <AdminShell activePath="/admin/pets" title={zhCN.admin.petsTitle} description={zhCN.admin.petsDescription}>
      <AdminFeedback error={error} successMessage={successMessage} />
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Pill className="text-accent">{zhCN.admin.petsBadge}</Pill>
            <h2 className="mt-4 text-2xl font-semibold text-white">{zhCN.admin.petsTitle}</h2>
            <p className="mt-3 text-sm leading-7 text-mist">{zhCN.admin.petListDescription}</p>
          </div>
          <Link href="/admin/pets/new" className="rounded-2xl bg-accent px-4 py-3 font-semibold text-slate-950">
            {zhCN.admin.newPetButton}
          </Link>
        </div>

        <div className="mt-6 space-y-4">
          {pets.length === 0 ? (
            <p className="text-sm text-mist">{zhCN.admin.emptyPets}</p>
          ) : (
            pets.map((pet) => (
              <div key={pet.id} className="rounded-3xl border border-line bg-black/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex gap-4">
                    {pet.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={pet.coverImageUrl} alt={pet.nameZh} className="h-24 w-24 rounded-2xl object-cover" />
                    ) : null}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold text-white">{pet.nameZh}</p>
                        <Pill>{pet.isActive ? zhCN.admin.activeOption : zhCN.admin.inactiveOption}</Pill>
                        {pet.rarity ? <Pill className="text-accentWarm">{pet.rarity}</Pill> : null}
                      </div>
                      <p className="mt-2 text-sm text-mist">{pet.slug}</p>
                      {pet.summaryZh ? <p className="mt-2 text-sm text-white/90">{pet.summaryZh}</p> : null}
                      <p className="mt-2 text-sm leading-7 text-mist">{pet.descriptionZh}</p>
                    </div>
                  </div>
                  <Link href={`/admin/pets/${pet.id}`} className="rounded-2xl border border-line px-4 py-3 text-white">
                    {zhCN.admin.editButton}
                  </Link>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-mist md:grid-cols-3">
                  <div>{zhCN.admin.coverImageLabel}：{pet.coverImageUrl ? "URL" : "-"}</div>
                  <div>{zhCN.admin.modelGlbLabel}：{pet.modelGlbUrl ? "URL" : "-"}</div>
                </div>

                <form action={savePetAction} className="mt-4 flex flex-wrap items-end gap-3">
                  <input type="hidden" name="id" value={pet.id} />
                  <input type="hidden" name="redirectTo" value="/admin/pets" />
                  <input type="hidden" name="slug" value={pet.slug} />
                  <input type="hidden" name="nameZh" value={pet.nameZh} />
                  <input type="hidden" name="summaryZh" value={pet.summaryZh} />
                  <input type="hidden" name="descriptionZh" value={pet.descriptionZh} />
                  <input type="hidden" name="rarity" value={pet.rarity ?? ""} />
                  <input type="hidden" name="coverImageUrl" value={pet.coverImageUrl ?? ""} />
                  <input type="hidden" name="modelGlbUrl" value={pet.modelGlbUrl ?? ""} />
                  <input type="hidden" name="isActive" value={String(pet.isActive)} />
                  <div className="space-y-2">
                    <label className="text-sm text-mist" htmlFor={`sortOrder-${pet.id}`}>
                      {zhCN.admin.sortOrderLabel}
                    </label>
                    <input
                      id={`sortOrder-${pet.id}`}
                      name="sortOrder"
                      type="number"
                      min="0"
                      defaultValue={pet.sortOrder}
                      className="w-32 rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
                      required
                    />
                  </div>
                  <button className="rounded-2xl bg-white/10 px-4 py-3 font-medium text-white">
                    {zhCN.admin.updatePetButton}
                  </button>
                </form>

                <form action={togglePetActiveAction} className="mt-3">
                  <input type="hidden" name="petId" value={pet.id} />
                  <input type="hidden" name="redirectTo" value="/admin/pets" />
                  <button className="rounded-2xl border border-line px-4 py-2 text-white">
                    {pet.isActive ? zhCN.admin.deactivateButton : zhCN.admin.activateButton}
                  </button>
                </form>
              </div>
            ))
          )}
        </div>
      </Card>
    </AdminShell>
  );
}
