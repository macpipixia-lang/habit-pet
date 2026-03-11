"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

export function ConfirmSubmitButton({
  children,
  className,
  confirmMessage,
  pendingLabel,
  type = "submit",
}: {
  children: ReactNode;
  className?: string;
  confirmMessage: string;
  pendingLabel?: string;
  type?: "submit" | "button";
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type={type}
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
      className={cn(className)}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
