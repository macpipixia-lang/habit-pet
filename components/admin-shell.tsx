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
              <h1 className="mt-4 text-3xl font-semibold text-ink">{title}</h1>
              <p className="mt-3 text-sm leading-7 text-mist">{description}</p>
            </div>
            <nav className="w-full overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <ul className="flex min-w-max gap-2">
                {adminNavItems.map((item) => {
                  const isActive = item.href === activePath;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "inline-flex rounded-full border px-4 py-2 text-sm transition duration-200",
                          isActive
                            ? "border-accent/70 bg-[linear-gradient(180deg,rgba(242,140,82,0.94),rgba(226,118,70,0.9))] text-white shadow-[0_8px_18px_rgba(242,140,82,0.34)]"
                            : "border-line bg-white/55 text-mist hover:-translate-y-0.5 hover:border-accent/35 hover:bg-white hover:text-ink",
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
          <form action={adminLogoutAction}>
            <button className="rounded-2xl border border-line px-4 py-3 text-ink transition hover:border-accent/35">
              {zhCN.admin.logoutButton}
            </button>
          </form>
        </div>
      </Card>
      {children}
    </div>
  );
}
