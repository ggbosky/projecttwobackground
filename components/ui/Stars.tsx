import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

export function Stars({ value, size = 14, className }: { value?: number; size?: number; className?: string }) {
  if (typeof value !== "number") return <span className="text-xs text-muted">Bez hodnocení</span>;
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`Hodnocení ${value} z 5`} title={`${value} / 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={size}
          strokeWidth={1.75}
          className={i < Math.round(value) ? "fill-amber-400 text-amber-400" : "fill-transparent text-line-strong"}
        />
      ))}
    </span>
  );
}
