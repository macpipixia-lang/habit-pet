"use client";

import { useActionState } from "react";
import { type AuthActionState, loginAction, registerAction } from "@/app/actions";
import { zhCN } from "@/lib/i18n/zhCN";

const initialState: AuthActionState = {};

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm text-mist" htmlFor={`${mode}-username`}>
          {zhCN.auth.usernameLabel}
        </label>
        <input
          id={`${mode}-username`}
          name="username"
          autoComplete="username"
          className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white outline-none transition focus:border-accent"
          placeholder={zhCN.auth.usernamePlaceholder}
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm text-mist" htmlFor={`${mode}-password`}>
          {zhCN.auth.passwordLabel}
        </label>
        <input
          id={`${mode}-password`}
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white outline-none transition focus:border-accent"
          placeholder={zhCN.auth.passwordPlaceholder}
          required
        />
      </div>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-accent px-4 py-3 font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? zhCN.auth.submitting : mode === "login" ? zhCN.auth.loginSubmit : zhCN.auth.registerSubmit}
      </button>
    </form>
  );
}
