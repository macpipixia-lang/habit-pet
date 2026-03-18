"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, Pill } from "@/components/ui";
import { zhCN } from "@/lib/i18n/zhCN";
import { AdminNoticeCard, postAdminJson } from "@/app/admin/_components/admin-client";
import { PetAssetFields } from "./pet-asset-fields";
import { PetStageAssetFields } from "./pet-stage-asset-fields";

type PetFormValue = {
  id?: string;
  slug: string;
  nameZh: string;
  summaryZh: string;
  descriptionZh: string;
  rarity: string | null;
  coverImageUrl: string | null;
  modelGlbUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  stages?: Array<{
    id: string;
    stageIndex: number;
    nameZh: string;
    coverImageUrl: string | null;
    modelGlbUrl: string | null;
  }>;
};

export function PetForm({
  title,
  description,
  submitLabel,
  pet,
  initialNotice,
}: Readonly<{
  title: string;
  description: string;
  submitLabel: string;
  pet?: PetFormValue | null;
  initialNotice?: { type: "error" | "success"; text: string } | null;
}>) {
  const blobConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const [formPet, setFormPet] = useState<PetFormValue | null>(pet ?? null);
  const [notice, setNotice] = useState(initialNotice ?? null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setNotice(null);

    try {
      const formData = new FormData(event.currentTarget);
      const rawStageAssets = String(formData.get("stageAssetsJson") ?? "").trim();
      const payload = Object.fromEntries(formData.entries());
      delete payload.stageAssetsJson;

      const result = await postAdminJson<PetFormValue & { stages?: PetFormValue["stages"] }>("/api/admin/pets/save", {
        ...payload,
        stageAssets: rawStageAssets ? JSON.parse(rawStageAssets) : [],
      });

      setFormPet(result.data ?? formPet);
      setNotice({ type: "success", text: result.message ?? zhCN.feedback.petSaved });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : zhCN.feedback.fallbackError });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminNoticeCard notice={notice} />
      {!blobConfigured ? (
        <Card className="border-amber-300/30 bg-amber-400/10">
          <Pill className="text-accentWarm">{zhCN.admin.envMissingTitle}</Pill>
          <p className="mt-3 text-sm text-amber-50">{zhCN.admin.envMissingDescription}</p>
        </Card>
      ) : null}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Pill className="text-accent">{title}</Pill>
            <h2 className="mt-4 text-2xl font-semibold text-white">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-mist">{description}</p>
            <p className="mt-2 text-xs text-mist">{zhCN.admin.formHint}</p>
          </div>
          <Link href="/admin/pets" className="rounded-2xl border border-line px-4 py-3 text-white">
            {zhCN.admin.backToPetsButton}
          </Link>
        </div>

        <form className="mt-6 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <input type="hidden" name="id" value={formPet?.id ?? ""} readOnly />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-mist" htmlFor="slug">
                {zhCN.admin.slugLabel}
              </label>
              <input
                id="slug"
                name="slug"
                defaultValue={formPet?.slug ?? ""}
                className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-mist" htmlFor="nameZh">
                {zhCN.admin.nameLabel}
              </label>
              <input
                id="nameZh"
                name="nameZh"
                defaultValue={formPet?.nameZh ?? ""}
                className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-mist" htmlFor="summaryZh">
              {zhCN.admin.summaryLabel}
            </label>
            <input
              id="summaryZh"
              name="summaryZh"
              defaultValue={formPet?.summaryZh ?? ""}
              className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-mist" htmlFor="descriptionZh">
              {zhCN.admin.descriptionLabel}
            </label>
            <textarea
              id="descriptionZh"
              name="descriptionZh"
              defaultValue={formPet?.descriptionZh ?? ""}
              className="min-h-32 w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
              required
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm text-mist" htmlFor="rarity">
                {zhCN.admin.rarityLabel}
              </label>
              <input
                id="rarity"
                name="rarity"
                defaultValue={formPet?.rarity ?? ""}
                className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-mist" htmlFor="sortOrder">
                {zhCN.admin.sortOrderLabel}
              </label>
              <input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min="0"
                defaultValue={formPet?.sortOrder ?? 0}
                className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-mist" htmlFor="isActive">
                {zhCN.admin.activeLabel}
              </label>
              <select
                id="isActive"
                name="isActive"
                defaultValue={String(formPet?.isActive ?? true)}
                className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white"
              >
                <option value="true">{zhCN.admin.activeOption}</option>
                <option value="false">{zhCN.admin.inactiveOption}</option>
              </select>
            </div>
          </div>

          <PetAssetFields
            initialCoverImageUrl={formPet?.coverImageUrl}
            initialModelGlbUrl={formPet?.modelGlbUrl}
          />

          {formPet?.id ? <PetStageAssetFields stages={formPet.stages ?? []} /> : null}

          <button disabled={pending} className="w-full rounded-2xl bg-accent px-4 py-3 font-semibold text-slate-950 disabled:opacity-70">
            {pending ? zhCN.auth.submitting : submitLabel}
          </button>
        </form>
      </Card>
    </div>
  );
}
