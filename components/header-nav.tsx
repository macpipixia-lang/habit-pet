"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
};

export function HeaderNav({ items }: Readonly<{ items: NavItem[] }>) {
  const pathname = usePathname();

  return (
    <nav
      className="w-full overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Main navigation"
    >
      <ul className="flex min-w-max items-center gap-2 pr-1">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex items-center rounded-full border px-3 py-2 text-sm transition duration-200",
                  isActive
                    ? "border-accent/70 bg-[linear-gradient(180deg,rgba(242,140,82,0.92),rgba(227,120,73,0.9))] font-medium text-white shadow-[0_8px_18px_rgba(242,140,82,0.35)]"
                    : "border-line bg-white/65 text-mist hover:-translate-y-0.5 hover:border-accent/40 hover:bg-white hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
