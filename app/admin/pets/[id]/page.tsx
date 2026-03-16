import { notFound } from "next/navigation";
import { AdminFeedback } from "@/app/admin/_components/admin-feedback";
import { getAdminPageParams } from "@/app/admin/_lib";
import { PetForm } from "@/app/admin/pets/_components/pet-form";
import { AdminShell } from "@/components/admin-shell";
import { getAdminSuccessMessage } from "@/lib/admin";
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
  const { error, success } = await getAdminPageParams(searchParams);
  const pet = await getAdminPetById(id);

  if (!pet) {
    notFound();
  }

  return (
    <AdminShell activePath="/admin/pets" title={zhCN.admin.editPetTitle} description={zhCN.admin.petsDescription}>
      <AdminFeedback error={error} successMessage={getAdminSuccessMessage(success)} />
      <PetForm
        title={zhCN.admin.editPetTitle}
        description={zhCN.admin.petsDescription}
        submitLabel={zhCN.admin.updatePetButton}
        pet={{
          ...pet,
          stages: pet.stages,
        }}
      />
    </AdminShell>
  );
}
