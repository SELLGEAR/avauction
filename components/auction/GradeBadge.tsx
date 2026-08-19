const GRADE_LABEL: Record<string, string> = {
  A: "Excellent",
  B: "Very Good",
  C: "Good",
  D: "Fair",
};

// A/B green, C amber, D red — see GRADING SYSTEM in CLAUDE.md. Poor/For
// Parts is a separate unpriced state, never shown on an auction card.
const GRADE_STYLE: Record<string, string> = {
  A: "border-[#1a5c38] bg-[#0d2218] text-[#22ee77]",
  B: "border-[#1a5c38] bg-[#0d2218] text-[#22ee77]",
  C: "border-[#6a4010] bg-[#2a1a06] text-[#ff8c00]",
  D: "border-[#6a1515] bg-[#2a0a0a] text-[#ff4444]",
};

interface GradeBadgeProps {
  grade: string;
  className?: string;
}

export function GradeBadge({ grade, className = "" }: GradeBadgeProps) {
  const style = GRADE_STYLE[grade] ?? "border-[#2a2a2a] bg-[#141414] text-[#999]";
  const label = GRADE_LABEL[grade] ?? grade;
  return (
    <span
      className={`rounded-md border px-[7px] py-[3px] text-[9px] font-bold uppercase tracking-wider ${style} ${className}`}
    >
      {grade} · {label}
    </span>
  );
}
