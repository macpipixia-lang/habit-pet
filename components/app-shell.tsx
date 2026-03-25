import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { HeaderNav } from "@/components/header-nav";
import { APP_NAME } from "@/lib/constants";
import { zhCN } from "@/lib/i18n/zhCN";

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
        <header className="sticky top-4 z-30 mb-8 rounded-3xl border border-line/80 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.98),rgba(250,244,233,0.94)),linear-gradient(180deg,rgba(242,140,82,0.09),rgba(216,111,122,0.05))] p-4 shadow-glow backdrop-blur-md">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <Link href="/" className="text-lg font-semibold tracking-[0.18em] text-ink uppercase transition hover:text-accentWarm">
                {APP_NAME}
              </Link>
              <p className="mt-1 text-sm text-mist">{zhCN.app.headerDescription}</p>
            </div>
            <div className="flex items-center gap-2 self-start md:self-center">
              {user ? (
                <span className="rounded-full border border-accent/30 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(244,234,220,0.88))] px-3 py-2 text-sm font-medium text-ink shadow-sm">
                  {user.username}
                </span>
              ) : (
                <>
                  <Link
                    className="rounded-full border border-line bg-white/75 px-4 py-2 text-sm text-mist transition hover:-translate-y-0.5 hover:border-accent/35 hover:bg-white hover:text-ink"
                    href="/auth"
                  >
                    {zhCN.nav.login}
                  </Link>
                  <Link
                    className="rounded-full border border-accent/70 bg-[linear-gradient(180deg,rgba(242,140,82,0.96),rgba(226,118,70,0.94))] px-4 py-2 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:brightness-105"
                    href="/auth"
                  >
                    {zhCN.nav.start}
                  </Link>
                </>
              )}
            </div>
          </div>
          {user ? (
            <div className="mt-3 border-t border-line/70 pt-3">
              <HeaderNav items={navItems} />
            </div>
          ) : null}
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
