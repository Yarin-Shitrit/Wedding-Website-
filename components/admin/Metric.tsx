export function Metric({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: "default" | "positive" | "warning" | "muted";
}) {
  const toneClass =
    tone === "positive"
      ? "text-sage-700"
      : tone === "warning"
      ? "text-blush-700"
      : tone === "muted"
      ? "text-ink/60"
      : "text-ink";
  return (
    <div className="card">
      <div className="text-xs text-ink/60">{label}</div>
      <div className={`text-3xl font-semibold mt-1 tabular-nums ${toneClass}`}>
        {value}
      </div>
      {hint && <div className="text-xs text-ink/50 mt-1">{hint}</div>}
    </div>
  );
}
