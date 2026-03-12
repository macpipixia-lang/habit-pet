import Link from "next/link";
import { AdminLoginForm } from "@/components/admin-login-form";
import { AdminShell } from "@/components/admin-shell";
import { Card, Pill } from "@/components/ui";
import { AdminFeedback } from "@/app/admin/_components/admin-feedback";
import { getAdminPageParams } from "@/app/admin/_lib";
import { getAdminSuccessMessage } from "@/lib/admin";
import { isAdminAuthenticated } from "@/lib/auth";
import { getAdminOverview } from "@/lib/data";
import { zhCN } from "@/lib/i18n/zhCN";

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { error, success } = await getAdminPageParams(searchParams);
  const successMessage = getAdminSuccessMessage(success);
  const isAdmin = await isAdminAuthenticated();

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-xl">
        <Card>
          <Pill className="text-accent">{zhCN.admin.title}</Pill>
          <h1 className="mt-4 text-3xl font-semibold text-white">{zhCN.admin.loginTitle}</h1>
          <p className="mt-3 text-sm leading-7 text-mist">{zhCN.admin.loginDescription}</p>
          <AdminFeedback error={error} successMessage={successMessage} />
          <div className="mt-6">
            <AdminLoginForm />
          </div>
        </Card>
      </div>
    );
  }

  const overview = await getAdminOverview();
  const summaryCards = [
    { label: zhCN.admin.summaryItems, value: overview.itemsCount },
    { label: zhCN.admin.summaryActiveItems, value: overview.activeItemsCount },
    { label: zhCN.admin.summaryTasks, value: overview.tasksCount },
    { label: zhCN.admin.summaryActiveTasks, value: overview.activeTasksCount },
    { label: zhCN.admin.summaryIssuedCodes, value: overview.issuedCodesCount },
  ];
  const moduleCards = [
    {
      href: "/admin/items",
      badge: zhCN.admin.itemsBadge,
      title: zhCN.admin.overviewItemsTitle,
      description: zhCN.admin.overviewItemsDescription,
    },
    {
      href: "/admin/codes",
      badge: zhCN.admin.codesBadge,
      title: zhCN.admin.overviewCodesTitle,
      description: zhCN.admin.overviewCodesDescription,
    },
    {
      href: "/admin/tasks",
      badge: zhCN.admin.tasksBadge,
      title: zhCN.admin.overviewTasksTitle,
      description: zhCN.admin.overviewTasksDescription,
    },
  ];

  return (
    <AdminShell
      activePath="/admin"
      title={zhCN.admin.overviewTitle}
      description={zhCN.admin.overviewDescription}
    >
      <AdminFeedback error={error} successMessage={successMessage} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <p className="text-sm text-mist">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{card.value}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        {moduleCards.map((card) => (
          <Card key={card.href} className="flex h-full flex-col">
            <Pill className="text-accent">{card.badge}</Pill>
            <h2 className="mt-4 text-2xl font-semibold text-white">{card.title}</h2>
            <p className="mt-3 flex-1 text-sm leading-7 text-mist">{card.description}</p>
            <Link
              href={card.href}
              className="mt-6 inline-flex w-fit rounded-2xl bg-accent px-4 py-3 font-semibold text-slate-950"
            >
              {zhCN.admin.goToModule}
            </Link>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}
