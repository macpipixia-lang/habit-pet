"use client";

import { useActionState } from "react";
import { adminLoginAction, type AdminActionState } from "@/app/actions";
import { zhCN } from "@/lib/i18n/zhCN";

const initialState: AdminActionState = {};

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(adminLoginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm text-mist" htmlFor="admin-secret">
          {zhCN.admin.secretLabel}
        </label>
        <input
          id="admin-secret"
          name="secret"
          type="password"
          className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white outline-none transition focus:border-accent"
          required
        />
      </div>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-accent px-4 py-3 font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? zhCN.auth.submitting : zhCN.admin.loginButton}
      </button>
    </form>
  );
}
