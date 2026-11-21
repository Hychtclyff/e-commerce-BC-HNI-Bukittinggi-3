import React from "react";
import { Chip, ChipProps } from "@heroui/react";
import clsx from "clsx";

const tijarahChipVariants = {
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
  outline:
    "bg-transparent text-text-primary border-border-subtle",
} as const satisfies Record<string, string>;

export type TijarahChipVariant = keyof typeof tijarahChipVariants;

export interface TijarahChipProps extends Omit<ChipProps, "variant"> {
  tijarahVariant?: TijarahChipVariant;
  heroVariant?: ChipProps["variant"];
}

export type ITijarahChipProps = TijarahChipProps;

export const TijarahChip: React.FC<TijarahChipProps> = ({
  tijarahVariant = "primary",
  heroVariant,
  className,
  children,
  ...props
}) => {
  const selectedPreset = tijarahChipVariants[tijarahVariant];

  return (
    <Chip
      {...props}
      variant={heroVariant}
      className={clsx(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors",
        selectedPreset,
        className
      )}
    >
      {children}
    </Chip>
  );
};
