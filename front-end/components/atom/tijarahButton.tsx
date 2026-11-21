import React from "react";
import { Button, ButtonProps, Spinner } from "@heroui/react";
import clsx from "clsx";

const tijarahButtonVariants = {
  primary:
    "bg-primary-sage hover:bg-primary-dark active:brightness-95 text-white border border-primary-sage transition-colors shadow-2xs",
  secondary:
    "bg-surface hover:bg-canvas active:bg-border-subtle/50 text-text-primary border border-border-subtle transition-colors shadow-2xs",
  soft:
    "bg-canvas hover:bg-border-subtle/60 active:bg-border-subtle text-text-primary border border-border-subtle transition-colors",
  outline:
    "bg-transparent hover:bg-primary-sage/10 active:bg-primary-sage/15 text-primary-sage border border-primary-sage/50 transition-colors",
  gold:
    "bg-accent-gold hover:brightness-95 active:brightness-90 text-white border border-accent-gold transition-colors shadow-2xs",
  accent:
    "bg-accent-gold hover:brightness-95 active:brightness-90 text-white border border-accent-gold transition-colors shadow-2xs",
  success:
    "bg-status-success hover:brightness-95 active:brightness-90 text-white border border-status-success transition-colors shadow-2xs",
  warning:
    "bg-[var(--badge-warning-bg)] hover:brightness-95 text-status-warning font-semibold border border-status-warning/30 transition-colors",
  danger:
    "bg-status-danger hover:brightness-95 active:brightness-90 text-white border border-status-danger transition-colors shadow-2xs",
  ghost:
    "bg-transparent hover:bg-canvas active:bg-border-subtle/50 text-text-muted hover:text-text-primary border border-transparent transition-colors",
} as const satisfies Record<string, string>;

export type TijarahButtonVariant = keyof typeof tijarahButtonVariants;

export interface TijarahButtonProps extends Omit<ButtonProps, "variant"> {
  tijarahVariant?: TijarahButtonVariant;
  heroVariant?: ButtonProps["variant"];
  isLoading?: boolean;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  title?: string;
}

export type ITijarahButtonProps = TijarahButtonProps;

export const TijarahButton: React.FC<TijarahButtonProps> = ({
  tijarahVariant,
  heroVariant,
  size = "md",
  className,
  children,
  isLoading,
  startContent,
  endContent,
  ...props
}) => {
  const resolvedVariant: TijarahButtonVariant =
    tijarahVariant ??
    (heroVariant === "outline"
      ? "outline"
      : heroVariant === "secondary"
      ? "secondary"
      : heroVariant === "ghost"
      ? "ghost"
      : heroVariant === "danger"
      ? "danger"
      : "primary");

  const selectedPreset = tijarahButtonVariants[resolvedVariant];

  const sizePreset =
    size === "sm"
      ? "h-8 px-2.5 py-1 text-xs gap-1.5"
      : size === "lg"
      ? "h-10 px-4 py-2 text-sm gap-2"
      : "h-9 px-3.5 py-1.5 text-xs sm:text-sm gap-1.5";

  return (
    <Button
      {...props}
      size={size}
      variant={heroVariant}
      className={clsx(
        "font-medium transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 rounded-lg inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-sage/40",
        sizePreset,
        selectedPreset,
        className
      )}
    >
      {isLoading ? (
        <Spinner size="sm" />
      ) : (
        <>
          {startContent}
          {children}
          {endContent}
        </>
      )}
    </Button>
  );
};
