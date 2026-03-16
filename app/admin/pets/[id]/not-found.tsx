import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { Card, Pill } from "@/components/ui";
import { zhCN } from "@/lib/i18n/zhCN";

export default function AdminPetNotFoundPage() {
  return (
    <AdminShell activePath="/admin/pets" title={zhCN.admin.petNotFoundTitle} description={zhCN.admin.petNotFoundDescription}>
      <Card>
        <Pill className="text-accentWarm">{zhCN.admin.petNotFoundTitle}</Pill>
        <p className="mt-4 text-sm leading-7 text-mist">{zhCN.admin.petNotFoundDescription}</p>
        <Link href="/admin/pets" className="mt-6 inline-flex rounded-2xl bg-accent px-4 py-3 font-semibold text-slate-950">
          {zhCN.admin.backToPetsButton}
        </Link>
      </Card>
    </AdminShell>
  );
}
