import type { RedeemCodeStatus } from "@prisma/client";
import { zhCN } from "@/lib/i18n/zhCN";

export const ADMIN_ROUTE_SET = new Set(["/admin", "/admin/items", "/admin/codes", "/admin/tasks", "/admin/pets", "/admin/today"]);

export const adminNavItems = [
  { href: "/admin", label: zhCN.admin.overviewBadge },
  { href: "/admin/items", label: zhCN.admin.itemsBadge },
  { href: "/admin/codes", label: zhCN.admin.codesBadge },
  { href: "/admin/tasks", label: zhCN.admin.tasksBadge },
  { href: "/admin/pets", label: zhCN.admin.petsBadge },
  { href: "/admin/today", label: zhCN.admin.todayAuditBadge },
] as const;

export function getAdminSuccessMessage(success: string | null) {
  switch (success) {
    case "login":
      return zhCN.feedback.adminLoginSuccess;
    case "logout":
      return zhCN.feedback.adminLogoutSuccess;
    case "item-saved":
      return zhCN.feedback.itemSaved;
    case "task-saved":
      return zhCN.feedback.taskSaved;
    case "item-status-updated":
      return zhCN.feedback.itemStatusUpdated;
    case "code-updated":
      return zhCN.feedback.codeUpdated;
    case "pet-saved":
      return zhCN.feedback.petSaved;
    case "pet-status-updated":
      return zhCN.feedback.petStatusUpdated;
    case "task-audit-updated":
      return zhCN.feedback.taskAuditUpdated;
    default:
      return null;
  }
}

export function getRedeemCodeStatusLabel(status: RedeemCodeStatus) {
  switch (status) {
    case "ISSUED":
      return zhCN.admin.statusFilterIssued;
    case "REDEEMED":
      return zhCN.admin.statusFilterRedeemed;
    case "VOID":
      return zhCN.admin.statusFilterVoid;
  }
}

export function getAdminRedirectTarget(value: FormDataEntryValue | null) {
  const target = typeof value === "string" ? value : "";
  return ADMIN_ROUTE_SET.has(target) ? target : "/admin";
}
