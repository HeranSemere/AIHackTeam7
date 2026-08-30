import { FieldStatus } from "@/lib/types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const STYLES: Record<FieldStatus, string> = {
  verified: "bg-forest-light text-forest",
  extracted: "bg-navy-soft text-navy",
  needsConfirmation: "bg-amber-light text-amber",
  missing: "bg-clay-light text-clay",
  contradiction: "bg-clay text-white",
};

const DOT: Record<FieldStatus, string> = {
  verified: "bg-forest",
  extracted: "bg-navy",
  needsConfirmation: "bg-amber",
  missing: "bg-clay",
  contradiction: "bg-white",
};

export default function StatusBadge({ status }: { status: FieldStatus }) {
  const { t } = useLanguage();
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[status]}`} aria-hidden />
      {t.status[status]}
    </span>
  );
}
