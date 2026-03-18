import { AdminPetsClient } from "@/app/admin/pets/pets-client";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getAdminPets } from "@/lib/data";
import { zhCN } from "@/lib/i18n/zhCN";

export default async function AdminPetsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = (await searchParams) ?? {};
  const pets = await getAdminPets();
  const error = typeof params.error === "string" ? params.error : null;
  const success = typeof params.success === "string" ? params.success : null;
  const initialNotice = error
    ? { type: "error" as const, text: error }
    : success
      ? { type: "success" as const, text: zhCN.feedback.petSaved }
      : null;

  return (
    <AdminShell activePath="/admin/pets" title={zhCN.admin.petsTitle} description={zhCN.admin.petsDescription}>
      <AdminPetsClient initialPets={pets} initialNotice={initialNotice} />
    </AdminShell>
  );
}
