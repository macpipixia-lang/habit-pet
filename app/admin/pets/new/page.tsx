import { AdminFeedback } from "@/app/admin/_components/admin-feedback";
import { getAdminPageParams } from "@/app/admin/_lib";
import { PetForm } from "@/app/admin/pets/_components/pet-form";
import { AdminShell } from "@/components/admin-shell";
import { getAdminSuccessMessage } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import { zhCN } from "@/lib/i18n/zhCN";

export default async function AdminNewPetPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const { error, success } = await getAdminPageParams(searchParams);

  return (
    <AdminShell activePath="/admin/pets" title={zhCN.admin.createPetTitle} description={zhCN.admin.petsDescription}>
      <AdminFeedback error={error} successMessage={getAdminSuccessMessage(success)} />
      <PetForm
        title={zhCN.admin.createPetTitle}
        description={zhCN.admin.petsDescription}
        submitLabel={zhCN.admin.savePetButton}
      />
    </AdminShell>
  );
}
