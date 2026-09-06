import type { MockPoint } from "@/lib/mock/sensor-data";

function stats(values: number[]) {
  if (!values.length) return { min: 0, max: 0, mean: 0, median: 0, std: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const median = sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return { min: sorted[0], max: sorted[sorted.length - 1], mean, median, std: Math.sqrt(variance) };
}

function format(value: number, decimals: number) {
  return value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function StatisticsTable({ data, unit = "", decimals = 1, source = "Measured data" }: { data: MockPoint[]; unit?: string; decimals?: number; source?: string }) {
  const all = stats(data.map((point) => point.value));
  const recent = stats(data.slice(-8).map((point) => point.value));
  const rows = [
    ["All samples", data.length, all],
    ["Recent window", Math.min(8, data.length), recent],
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-line/80">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-left text-xs">
          <thead className="bg-muted/5 text-[10px] uppercase tracking-[0.08em] text-muted">
            <tr>
              <th className="px-3 py-3 font-semibold">Period</th>
              <th className="px-3 py-3 font-semibold">Samples</th>
              <th className="px-3 py-3 font-semibold">Min</th>
              <th className="px-3 py-3 font-semibold">Max</th>
              <th className="px-3 py-3 font-semibold">Mean</th>
              <th className="px-3 py-3 font-semibold">Median</th>
              <th className="px-3 py-3 font-semibold">Std. Dev.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, samples, values]) => (
              <tr key={label as string} className="border-t border-line/70">
                <td className="px-3 py-3 font-medium text-foreground">{label as string}</td>
                <td className="px-3 py-3 text-muted">{samples as number}</td>
                <td className="px-3 py-3 text-muted">{format(values.min, decimals)}{unit}</td>
                <td className="px-3 py-3 text-muted">{format(values.max, decimals)}{unit}</td>
                <td className="px-3 py-3 font-medium text-foreground">{format(values.mean, decimals)}{unit}</td>
                <td className="px-3 py-3 text-muted">{format(values.median, decimals)}{unit}</td>
                <td className="px-3 py-3 text-muted">{format(values.std, decimals)}{unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-line/70 px-3 py-2 text-[10px] text-muted">Source: {source}</div>
    </div>
  );
}
