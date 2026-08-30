import { EligibilityStatus } from "@/lib/types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function ScoreBar({ score, max }: { score: number; max: number }) {
  const pct = Math.round((score / max) * 100);
  const color = pct >= 80 ? "bg-forest" : pct >= 55 ? "bg-gold" : "bg-clay";
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 w-full max-w-[160px] overflow-hidden rounded-full bg-coffee/10">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="whitespace-nowrap text-sm font-semibold tabular-nums">
        {score}/{max}
      </span>
    </div>
  );
}

export function ScoreCircle({ score }: { score: number }) {
  const color = score >= 80 ? "text-forest" : score >= 55 ? "text-gold-dark" : "text-clay";
  return (
    <div className={`flex h-24 w-24 flex-col items-center justify-center rounded-full border-4 border-current ${color}`}>
      <span className="font-display text-2xl font-semibold leading-none">{score}</span>
      <span className="text-[10px] uppercase tracking-wide text-ink/50">/ 100</span>
    </div>
  );
}

export function EligibilityPill({ status }: { status: EligibilityStatus }) {
  const { t } = useLanguage();
  const styles =
    status === "notEligible"
      ? "bg-clay-light text-clay"
      : status === "provisionallyEligible"
      ? "bg-amber-light text-amber"
      : "bg-forest-light text-forest";
  const icon = status === "notEligible" ? "✕" : "✓";
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold ${styles}`}>
      <span aria-hidden>{icon}</span>
      {t.status[status]}
    </span>
  );
}
