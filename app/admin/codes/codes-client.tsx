"use client";

import { useState } from "react";
import { Card, Pill } from "@/components/ui";
import { getRedeemCodeStatusLabel } from "@/lib/admin";
import { zhCN } from "@/lib/i18n/zhCN";
import { AdminNoticeCard, postAdminJson, useAdminNotice } from "@/app/admin/_components/admin-client";

type AdminCode = {
  id: string;
  status: "ISSUED" | "REDEEMED" | "VOID";
  adminNote: string | null;
  issuedAt: Date | string;
  redeemedAt: Date | string | null;
  user: {
    username: string;
  };
  item: {
    nameZh: string;
  };
};

export function AdminCodesClient({
  initialCodes,
  initialNotice,
  statusFilter,
}: {
  initialCodes: AdminCode[];
  initialNotice: { type: "error" | "success"; text: string } | null;
  statusFilter?: string;
}) {
  const [codes, setCodes] = useState(initialCodes);
  const { notify } = useAdminNotice(initialNotice);
  const [pendingCode, setPendingCode] = useState<string | null>(null);

  async function handleUpdate(codeId: string, status: "REDEEMED" | "VOID", adminNote: string) {
    setPendingCode(`${codeId}:${status}`);

    try {
      const result = await postAdminJson<{
        id: string;
        status: "REDEEMED" | "VOID";
        adminNote: string | null;
        redeemedAt: string | null;
      }>("/api/admin/codes/update", {
        code: codeId,
        status,
        adminNote,
      });

      const updated = result.data!;
      setCodes((current) => current.flatMap((code) => {
        if (code.id !== updated.id) {
          return [code];
        }

        const next = {
          ...code,
          status: updated.status,
          adminNote: updated.adminNote,
          redeemedAt: updated.redeemedAt,
        };

        if (statusFilter && statusFilter !== updated.status) {
          return [];
        }

        return [next];
      }));

      notify({ type: "success", text: result.message ?? zhCN.feedback.codeUpdated });
    } catch (error) {
      notify({ type: "error", text: error instanceof Error ? error.message : zhCN.feedback.fallbackError });
    } finally {
      setPendingCode(null);
    }
  }

  return (
    <>
      <Card>
        <Pill className="text-accent">{zhCN.admin.codesBadge}</Pill>
        <h2 className="mt-4 text-2xl font-semibold text-ink">{zhCN.admin.codesTitle}</h2>
        <p className="mt-3 text-sm leading-7 text-mist">{zhCN.admin.codesDescription}</p>
        <div className="mt-6 space-y-3">
          {codes.length === 0 ? (
            <p className="text-sm text-mist">{zhCN.admin.emptyCodes}</p>
          ) : (
            codes.map((redeemCode) => (
              <div key={redeemCode.id} className="rounded-2xl border border-line bg-panelAlt/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink">{redeemCode.item.nameZh}</p>
                    <p className="mt-1 break-all text-sm text-mist">{redeemCode.id}</p>
                  </div>
                  <Pill>{getRedeemCodeStatusLabel(redeemCode.status)}</Pill>
                </div>
                <p className="mt-3 text-sm text-mist">用户：{redeemCode.user.username}</p>
                <p className="mt-1 text-sm text-mist">
                  发放时间：{new Date(redeemCode.issuedAt).toLocaleString("zh-CN", { hour12: false })}
                </p>
                {redeemCode.redeemedAt ? (
                  <p className="mt-1 text-sm text-mist">
                    处理时间：{new Date(redeemCode.redeemedAt).toLocaleString("zh-CN", { hour12: false })}
                  </p>
                ) : null}
                {redeemCode.status === "ISSUED" ? (
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <CodeActionForm
                      buttonLabel={zhCN.admin.redeemButton}
                      confirmMessage={zhCN.admin.redeemConfirm}
                      noteDefault={redeemCode.adminNote ?? ""}
                      pending={pendingCode === `${redeemCode.id}:REDEEMED`}
                      onSubmit={(note) => void handleUpdate(redeemCode.id, "REDEEMED", note)}
                    />
                    <CodeActionForm
                      buttonLabel={zhCN.admin.voidButton}
                      confirmMessage={zhCN.admin.voidConfirm}
                      noteDefault={redeemCode.adminNote ?? ""}
                      pending={pendingCode === `${redeemCode.id}:VOID`}
                      secondary
                      onSubmit={(note) => void handleUpdate(redeemCode.id, "VOID", note)}
                    />
                  </div>
                ) : redeemCode.adminNote ? (
                  <p className="mt-3 text-sm text-mist">
                    {zhCN.admin.noteLabel}：{redeemCode.adminNote}
                  </p>
                ) : null}
              </div>
            ))
          )}
        </div>
      </Card>
    </>
  );
}

function CodeActionForm({
  buttonLabel,
  confirmMessage,
  noteDefault,
  pending,
  secondary,
  onSubmit,
}: {
  buttonLabel: string;
  confirmMessage: string;
  noteDefault: string;
  pending: boolean;
  secondary?: boolean;
  onSubmit: (note: string) => void;
}) {
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();

        if (!window.confirm(confirmMessage)) {
          return;
        }

        const formData = new FormData(event.currentTarget);
        onSubmit(String(formData.get("adminNote") ?? ""));
      }}
    >
      <label className="block text-sm text-mist">
        {zhCN.admin.noteLabel}
        <input name="adminNote" defaultValue={noteDefault} className="mt-2 w-full rounded-2xl border border-line bg-panelAlt/70 px-4 py-3 text-ink" />
      </label>
      <button
        disabled={pending}
        className={
          secondary
            ? "w-full rounded-2xl border border-line px-4 py-3 text-ink disabled:opacity-70"
            : "w-full rounded-2xl bg-accent px-4 py-3 font-semibold text-slate-950 disabled:opacity-70"
        }
      >
        {pending ? zhCN.auth.submitting : buttonLabel}
      </button>
    </form>
  );
}
