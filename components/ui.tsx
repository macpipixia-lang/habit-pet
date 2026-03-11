import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-3xl border border-line bg-white/5 p-5 backdrop-blur", className)}
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
      className={cn("inline-flex items-center rounded-full border border-line bg-white/5 px-3 py-1 text-xs font-medium text-mist", className)}
      {...props}
    />
  );
}
