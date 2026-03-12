import Link from "next/link";
import { adminLogoutAction } from "@/app/actions";
import { Card, Pill } from "@/components/ui";
import { adminNavItems } from "@/lib/admin";
import { zhCN } from "@/lib/i18n/zhCN";
import { cn } from "@/lib/utils";

export function AdminShell({
  activePath,
  title,
  description,
  children,
}: Readonly<{
  activePath: string;
  title: string;
  description: string;
  children: React.ReactNode;
}>) {
  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-4">
            <div>
              <Pill className="text-accent">{zhCN.admin.title}</Pill>
              <h1 className="mt-4 text-3xl font-semibold text-white">{title}</h1>
              <p className="mt-3 text-sm leading-7 text-mist">{description}</p>
            </div>
            <nav className="flex flex-wrap gap-2">
              {adminNavItems.map((item) => {
                const isActive = item.href === activePath;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm transition",
                      isActive
                        ? "border-accent bg-accent text-slate-950"
                        : "border-line text-mist hover:border-white/20 hover:text-white",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <form action={adminLogoutAction}>
            <button className="rounded-2xl border border-line px-4 py-3 text-white">
              {zhCN.admin.logoutButton}
            </button>
          </form>
        </div>
      </Card>
      {children}
    </div>
  );
}

