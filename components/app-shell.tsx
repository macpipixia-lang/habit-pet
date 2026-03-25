import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { APP_NAME } from "@/lib/constants";
import { zhCN } from "@/lib/i18n/zhCN";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: zhCN.nav.dashboard },
  { href: "/backpack", label: zhCN.nav.backpack },
  { href: "/pokedex", label: zhCN.nav.pokedex },
  { href: "/shop", label: zhCN.nav.shop },
  { href: "/history", label: zhCN.nav.history },
  { href: "/settings", label: zhCN.nav.settings },
];

export async function AppShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-night text-ink">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(242,140,82,0.14),transparent_30%),radial-gradient(circle_at_top_right,rgba(216,111,122,0.12),transparent_24%),linear-gradient(180deg,#fffdf8_0%,#f8f5ef_48%,#f3ecdf_100%)]" />
      <div className="fixed inset-0 -z-10 bg-grid bg-[size:28px_28px] opacity-60" />
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-line bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(250,244,233,0.9))] p-4 shadow-glow backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="text-lg font-semibold tracking-[0.18em] text-ink uppercase">
              {APP_NAME}
            </Link>
            <p className="mt-1 text-sm text-mist">{zhCN.app.headerDescription}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {user ? (
              <>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-full border border-line bg-white/55 px-3 py-2 text-sm text-mist transition hover:border-accent/35 hover:bg-white/80 hover:text-ink",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                <span className="rounded-full border border-line bg-panelAlt/80 px-3 py-2 text-sm text-ink">{user.username}</span>
              </>
            ) : (
              <>
                <Link className="rounded-full border border-line bg-white/55 px-4 py-2 text-sm text-mist transition hover:border-accent/35 hover:bg-white/80 hover:text-ink" href="/auth">
                  {zhCN.nav.login}
                </Link>
                <Link className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-night transition hover:brightness-105" href="/auth">
                  {zhCN.nav.start}
                </Link>
              </>
            )}
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
