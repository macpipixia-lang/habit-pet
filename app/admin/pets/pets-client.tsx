"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, Pill } from "@/components/ui";
import { zhCN } from "@/lib/i18n/zhCN";
import { AdminNoticeCard, postAdminJson, useAdminNotice } from "@/app/admin/_components/admin-client";

type AdminPet = {
  id: string;
  slug: string;
  nameZh: string;
  summaryZh: string | null;
  descriptionZh: string;
  rarity: string | null;
  coverImageUrl: string | null;
  modelGlbUrl: string | null;
  sortOrder: number;
  isActive: boolean;
};

export function AdminPetsClient({
  initialPets,
  initialNotice,
}: {
  initialPets: AdminPet[];
  initialNotice: { type: "error" | "success"; text: string } | null;
}) {
  const [pets, setPets] = useState(initialPets);
  const { notify } = useAdminNotice(initialNotice);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  async function handleSortSave(formData: FormData) {
    const payload = Object.fromEntries(formData.entries());
    const petId = String(payload.id);
    setPendingKey(`save:${petId}`);

    try {
      const result = await postAdminJson<AdminPet>("/api/admin/pets/save", payload);
      const savedPet = result.data!;
      setPets((current) => current.map((pet) => (pet.id === savedPet.id ? { ...pet, ...savedPet } : pet)));
      notify({ type: "success", text: result.message ?? zhCN.feedback.petSaved });
    } catch (error) {
      notify({ type: "error", text: error instanceof Error ? error.message : zhCN.feedback.fallbackError });
    } finally {
      setPendingKey(null);
    }
  }

  async function handleToggle(petId: string) {
    const previousPets = pets;
    setPendingKey(`toggle:${petId}`);
    setPets((current) => current.map((pet) => (pet.id === petId ? { ...pet, isActive: !pet.isActive } : pet)));

    try {
      const result = await postAdminJson<AdminPet>("/api/admin/pets/toggle", { petId });
      const updatedPet = result.data!;
      setPets((current) => current.map((pet) => (pet.id === updatedPet.id ? { ...pet, ...updatedPet } : pet)));
      notify({ type: "success", text: result.message ?? zhCN.feedback.petStatusUpdated });
    } catch (error) {
      setPets(previousPets);
      notify({ type: "error", text: error instanceof Error ? error.message : zhCN.feedback.fallbackError });
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Pill className="text-accent">{zhCN.admin.petsBadge}</Pill>
            <h2 className="mt-4 text-2xl font-semibold text-ink">{zhCN.admin.petsTitle}</h2>
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
              <div key={pet.id} className="rounded-3xl border border-line bg-panelAlt/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex gap-4">
                    {pet.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={pet.coverImageUrl} alt={pet.nameZh} className="aspect-square h-24 w-24 rounded-2xl object-cover" />
                    ) : null}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold text-ink">{pet.nameZh}</p>
                        <Pill>{pet.isActive ? zhCN.admin.activeOption : zhCN.admin.inactiveOption}</Pill>
                        {pet.rarity ? <Pill className="text-accentWarm">{pet.rarity}</Pill> : null}
                      </div>
                      <p className="mt-2 text-sm text-mist">{pet.slug}</p>
                      {pet.summaryZh ? <p className="mt-2 text-sm text-ink/80">{pet.summaryZh}</p> : null}
                      <p className="mt-2 text-sm leading-7 text-mist">{pet.descriptionZh}</p>
                    </div>
                  </div>
                  <Link href={`/admin/pets/${pet.id}`} className="rounded-2xl border border-line px-4 py-3 text-ink">
                    {zhCN.admin.editButton}
                  </Link>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-mist md:grid-cols-3">
                  <div>{zhCN.admin.coverImageLabel}：{pet.coverImageUrl ? "URL" : "-"}</div>
                  <div>{zhCN.admin.modelGlbLabel}：{pet.modelGlbUrl ? "URL" : "-"}</div>
                </div>

                <form
                  className="mt-4 flex flex-wrap items-end gap-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleSortSave(new FormData(event.currentTarget));
                  }}
                >
                  <input type="hidden" name="id" value={pet.id} />
                  <input type="hidden" name="slug" value={pet.slug} />
                  <input type="hidden" name="nameZh" value={pet.nameZh} />
                  <input type="hidden" name="summaryZh" value={pet.summaryZh ?? ""} />
                  <input type="hidden" name="descriptionZh" value={pet.descriptionZh} />
                  <input type="hidden" name="rarity" value={pet.rarity ?? ""} />
                  <input type="hidden" name="coverImageUrl" value={pet.coverImageUrl ?? ""} />
                  <input type="hidden" name="modelGlbUrl" value={pet.modelGlbUrl ?? ""} />
                  <input type="hidden" name="isActive" value={String(pet.isActive)} />
                  <div className="space-y-2">
                    <label className="text-sm text-mist" htmlFor={`sortOrder-${pet.id}`}>
                      {zhCN.admin.sortOrderLabel}
                    </label>
                    <input id={`sortOrder-${pet.id}`} name="sortOrder" type="number" min="0" defaultValue={pet.sortOrder} className="w-32 rounded-2xl border border-line bg-panelAlt/70 px-4 py-3 text-ink" required />
                  </div>
                  <button disabled={pendingKey === `save:${pet.id}`} className="rounded-2xl border border-line bg-panelAlt/70 px-4 py-3 font-medium text-ink disabled:opacity-70">
                    {pendingKey === `save:${pet.id}` ? zhCN.auth.submitting : zhCN.admin.updatePetButton}
                  </button>
                </form>

                <div className="mt-3">
                  <button disabled={Boolean(pendingKey)} onClick={() => void handleToggle(pet.id)} className="rounded-2xl border border-line px-4 py-2 text-ink disabled:opacity-70">
                    {pendingKey === `toggle:${pet.id}` ? zhCN.auth.submitting : pet.isActive ? zhCN.admin.deactivateButton : zhCN.admin.activateButton}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </>
  );
}
