import React, { useId } from "react";
import { Input, InputProps } from "@heroui/react";
import clsx from "clsx";

const tijarahInputVariants = {
  primary:
    "border border-border-subtle bg-surface text-text-primary placeholder:text-text-muted/60 focus-within:!border-primary-sage focus-within:ring-1 focus-within:ring-primary-sage shadow-2xs",
  secondary:
    "border border-border-subtle bg-canvas text-text-primary placeholder:text-text-muted/60 hover:bg-surface focus-within:!bg-surface focus-within:!border-primary-sage",
  error:
    "border border-status-danger bg-[var(--badge-danger-bg)] text-status-danger placeholder:text-status-danger/60 focus-within:!border-status-danger focus-within:ring-1 focus-within:ring-status-danger",
} as const satisfies Record<string, string>;

export type TijarahInputVariant = keyof typeof tijarahInputVariants;

export interface TijarahInputProps extends Omit<InputProps, "variant"> {
  tijarahVariant?: TijarahInputVariant;
  heroVariant?: InputProps["variant"];
  label?: React.ReactNode;
  errorMessage?: React.ReactNode;
  isInvalid?: boolean;
  radius?: string;
  endContent?: React.ReactNode;
  startContent?: React.ReactNode;
  startContentClassName?: string;
}

export type ITijarahInputProps = TijarahInputProps;

export const TijarahInput = React.forwardRef<HTMLInputElement, TijarahInputProps>(
  (
    {
      tijarahVariant = "primary",
      heroVariant = "primary",
      label,
      errorMessage,
      isInvalid,
      className,
      endContent,
      startContent,
      startContentClassName,
      radius,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const selectedPreset = tijarahInputVariants[isInvalid ? "error" : tijarahVariant];

    return (
      <div className="w-full flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-text-primary"
          >
            {label}
          </label>
        )}
        <div className="relative w-full flex items-center">
          {startContent && (
            <div className="absolute left-2.5 z-10 flex items-center justify-center text-text-muted pointer-events-none">
              {startContent}
            </div>
          )}
          <Input
            ref={ref}
            id={inputId}
            {...props}
            variant={heroVariant}
            className={clsx(
              "w-full h-8.5 px-3 py-1.5 transition-colors duration-150 rounded-lg text-xs sm:text-sm outline-none",
              startContent && (startContentClassName || "pl-8"),
              endContent && "pr-8",
              selectedPreset,
              className
            )}
          />
          {endContent && (
            <div className="absolute right-2.5 z-10 flex items-center justify-center text-text-muted">
              {endContent}
            </div>
          )}
        </div>
        {isInvalid && errorMessage && (
          <span className="text-[11px] text-status-danger font-medium">
            {errorMessage}
          </span>
        )}
      </div>
    );
  }
);

TijarahInput.displayName = "TijarahInput";
