import { ampel, AMPEL_LABEL, type Auftrag, type Ampel } from "@/lib/gutachten";
import { cn } from "@/lib/utils";

const styles: Record<Ampel, string> = {
  gruen: "bg-status-ok-soft text-status-ok",
  gelb: "bg-status-warn-soft text-status-warn",
  rot: "bg-status-late-soft text-status-late",
  fertig: "bg-status-done-soft text-status-done",
};

/** Zusätzliches Formzeichen, damit der Status nicht nur über Farbe erkennbar ist */
const zeichen: Record<Ampel, string> = {
  gruen: "●",
  gelb: "▲",
  rot: "■",
  fertig: "✓",
};

export function StatusPill({ auftrag, className }: { auftrag: Auftrag; className?: string }) {
  const a = ampel(auftrag);
  return (
    <span
      role="status"
      aria-label={`Fristenstatus: ${AMPEL_LABEL[a]}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        styles[a],
        className,
      )}
    >
      <span aria-hidden="true" className="text-[0.7rem] leading-none">
        {zeichen[a]}
      </span>
      {AMPEL_LABEL[a]}
    </span>
  );
}


export function statusDot(a: Ampel) {
  return styles[a];
}
