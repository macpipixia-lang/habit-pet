"use client";

import { useActionState } from "react";
import { loginAction, registerAction } from "@/app/actions";

const initialState = {};

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm text-mist" htmlFor={`${mode}-username`}>
          Username
        </label>
        <input
          id={`${mode}-username`}
          name="username"
          autoComplete="username"
          className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white outline-none transition focus:border-accent"
          placeholder="habit_ranger"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm text-mist" htmlFor={`${mode}-password`}>
          Password
        </label>
        <input
          id={`${mode}-password`}
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className="w-full rounded-2xl border border-line bg-black/20 px-4 py-3 text-white outline-none transition focus:border-accent"
          placeholder="Minimum 6 characters"
          required
        />
      </div>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-accent px-4 py-3 font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Working..." : mode === "login" ? "Login" : "Create account"}
      </button>
    </form>
  );
}
