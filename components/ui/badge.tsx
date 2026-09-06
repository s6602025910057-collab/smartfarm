import type { ReactNode } from "react";

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning";
}) {
  const tones = {
    neutral: "border-line bg-muted/15 text-soft",
    success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    warning: "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  } as const;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${tones[tone]}`}
    >
      <span className={`size-1.5 rounded-full ${tone === "success" ? "bg-emerald-500" : tone === "warning" ? "bg-amber-500" : "bg-muted"}`} />
      {children}
    </span>
  );
}
