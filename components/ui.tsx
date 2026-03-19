import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-3xl border border-line bg-panel/80 p-5 shadow-glow backdrop-blur", className)}
      {...props}
    />
  );
}

export function Pill({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full border border-line bg-panelAlt/80 px-3 py-1 text-xs font-medium text-mist", className)}
      {...props}
    />
  );
}
