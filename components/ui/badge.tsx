import type { ReactNode } from "react";

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning";
}) {
  const tones = {
    neutral: "border-slate-700 bg-slate-800/70 text-slate-300",
    success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    warning: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${tones[tone]}`}
    >
      <span className={`size-1.5 rounded-full ${tone === "success" ? "bg-emerald-400" : tone === "warning" ? "bg-amber-400" : "bg-slate-400"}`} />
      {children}
    </span>
  );
}
