import { AdminItemsClient } from "@/app/admin/items/items-client";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getAdminItems } from "@/lib/data";
import { zhCN } from "@/lib/i18n/zhCN";

export default async function AdminItemsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = (await searchParams) ?? {};
  const items = await getAdminItems();
  const error = typeof params.error === "string" ? params.error : null;
  const success = typeof params.success === "string" ? params.success : null;
  const initialNotice = error
    ? { type: "error" as const, text: error }
    : success
      ? { type: "success" as const, text: zhCN.feedback.itemSaved }
      : null;

  return (
    <AdminShell activePath="/admin/items" title={zhCN.admin.itemsTitle} description={zhCN.admin.itemsDescription}>
      <AdminItemsClient initialItems={items} initialNotice={initialNotice} />
    </AdminShell>
  );
}
