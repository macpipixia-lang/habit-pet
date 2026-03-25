import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-line bg-[radial-gradient(circle_at_top_left,rgba(242,140,82,0.16),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(109,171,255,0.14),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(250,244,233,0.92))] p-5 shadow-glow backdrop-blur",
        className,
      )}
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
      className={cn(
        "inline-flex items-center rounded-full border border-line bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(244,234,220,0.88))] px-3 py-1 text-xs font-medium text-mist shadow-sm",
        className,
      )}
      {...props}
    />
  );
}
