import { PetForm } from "@/app/admin/pets/_components/pet-form";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { zhCN } from "@/lib/i18n/zhCN";

export default async function AdminNewPetPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? params.error : null;
  const success = typeof params.success === "string" ? params.success : null;
  const initialNotice = error
    ? { type: "error" as const, text: error }
    : success
      ? { type: "success" as const, text: zhCN.feedback.petSaved }
      : null;

  return (
    <AdminShell activePath="/admin/pets" title={zhCN.admin.createPetTitle} description={zhCN.admin.petsDescription}>
      <PetForm
        title={zhCN.admin.createPetTitle}
        description={zhCN.admin.petsDescription}
        submitLabel={zhCN.admin.savePetButton}
        initialNotice={initialNotice}
      />
    </AdminShell>
  );
}
