import React from "react";
import { Chip, ChipProps } from "@heroui/react";
import clsx from "clsx";

const tijarahBadgeVariants = {
  primary:
    "bg-[var(--badge-primary-bg)] text-[var(--badge-primary-text)] border-[var(--badge-primary-border)]",
  secondary:
    "bg-[var(--badge-secondary-bg)] text-[var(--badge-secondary-text)] border-[var(--badge-secondary-border)]",
  success:
    "bg-[var(--badge-success-bg)] text-status-success border-status-success/30",
  warning:
    "bg-[var(--badge-warning-bg)] text-status-warning border-status-warning/30",
  danger:
    "bg-[var(--badge-danger-bg)] text-status-danger border-status-danger/30",
} as const satisfies Record<string, string>;

export type TijarahBadgeVariant = keyof typeof tijarahBadgeVariants;

export interface TijarahBadgeProps extends Omit<ChipProps, "variant" | "content"> {
  tijarahVariant?: TijarahBadgeVariant;
  heroVariant?: ChipProps["variant"];
  content?: React.ReactNode;
  classNames?: Record<string, string>;
  title?: string;
}

export type ITijarahBadgeProps = TijarahBadgeProps;

export const TijarahBadge: React.FC<TijarahBadgeProps> = ({
  tijarahVariant = "primary",
  heroVariant,
  className,
  children,
  content,
  classNames,
  ...props
}) => {
  const selectedPreset = tijarahBadgeVariants[tijarahVariant];

  return (
    <Chip
      {...props}
      variant={heroVariant}
      className={clsx(
        "inline-flex items-center justify-center shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium leading-tight border transition-colors max-w-full overflow-hidden text-ellipsis whitespace-nowrap",
        selectedPreset,
        className
      )}
    >
      {children}
    </Chip>
  );
};
