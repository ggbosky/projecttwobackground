import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";
import type { PublicUser } from "@/lib/types";

const SIZES = {
  xs: "size-5 text-[9px]",
  sm: "size-6 text-[10px]",
  md: "size-8 text-xs",
  lg: "size-11 text-sm",
  xl: "size-14 text-base",
};

export function Avatar({
  name,
  color,
  size = "md",
  className,
  title,
}: {
  name: string;
  color?: string;
  size?: keyof typeof SIZES;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title ?? name}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white ring-2 ring-surface",
        SIZES[size],
        className,
      )}
      style={{ background: color ?? "linear-gradient(135deg, #71717a, #3f3f46)" }}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarStack({ members, max = 4, size = "sm" }: { members: Pick<PublicUser, "id" | "name" | "color" | "role">[]; max?: number; size?: keyof typeof SIZES }) {
  const shown = members.slice(0, max);
  const rest = members.length - shown.length;
  return (
    <div className="flex -space-x-1.5">
      {shown.map((m) => (
        <Avatar key={m.id} name={m.name} color={m.color} size={size} title={`${m.name} – ${m.role}`} />
      ))}
      {rest > 0 && (
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-full bg-surface-3 font-medium text-fg-2 ring-2 ring-surface",
            SIZES[size],
          )}
        >
          +{rest}
        </span>
      )}
    </div>
  );
}
