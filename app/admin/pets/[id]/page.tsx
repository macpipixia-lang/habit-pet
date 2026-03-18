import { notFound } from "next/navigation";
import { PetForm } from "@/app/admin/pets/_components/pet-form";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getAdminPetById } from "@/lib/data";
import { zhCN } from "@/lib/i18n/zhCN";

export default async function AdminEditPetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const { id } = await params;
  const pet = await getAdminPetById(id);

  if (!pet) {
    notFound();
  }

  const query = (await searchParams) ?? {};
  const error = typeof query.error === "string" ? query.error : null;
  const success = typeof query.success === "string" ? query.success : null;
  const initialNotice = error
    ? { type: "error" as const, text: error }
    : success
      ? { type: "success" as const, text: zhCN.feedback.petSaved }
      : null;

  return (
    <AdminShell activePath="/admin/pets" title={zhCN.admin.editPetTitle} description={zhCN.admin.petsDescription}>
      <PetForm
        title={zhCN.admin.editPetTitle}
        description={zhCN.admin.petsDescription}
        submitLabel={zhCN.admin.updatePetButton}
        initialNotice={initialNotice}
        pet={{
          ...pet,
          stages: pet.stages,
        }}
      />
    </AdminShell>
  );
}
