import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { ToastProvider } from "@/components/toast-provider";
import { zhCN } from "@/lib/i18n/zhCN";
import "./globals.css";

export const metadata: Metadata = {
  title: zhCN.app.name,
  description: zhCN.app.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body>
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
