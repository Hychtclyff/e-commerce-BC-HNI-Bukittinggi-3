import React, { useId } from "react";
import { TextArea, TextAreaProps } from "@heroui/react";
import clsx from "clsx";

const tijarahTextAreaVariants = {
  primary:
    "border border-border-subtle bg-surface text-text-primary placeholder:text-text-muted/60 focus-within:!border-primary-sage focus-within:ring-1 focus-within:ring-primary-sage shadow-2xs",
  secondary:
    "border border-border-subtle bg-canvas text-text-primary placeholder:text-text-muted/60 hover:bg-surface focus-within:!bg-surface focus-within:!border-primary-sage",
  error:
    "border border-status-danger bg-[var(--badge-danger-bg)] text-status-danger placeholder:text-status-danger/60 focus-within:!border-status-danger focus-within:ring-1 focus-within:ring-status-danger",
} as const satisfies Record<string, string>;

export type TijarahTextAreaVariant = keyof typeof tijarahTextAreaVariants;

export interface TijarahTextAreaProps extends Omit<TextAreaProps, "variant"> {
  tijarahVariant?: TijarahTextAreaVariant;
  heroVariant?: TextAreaProps["variant"];
  label?: React.ReactNode;
}

export type ITijarahTextAreaProps = TijarahTextAreaProps;

export const TijarahTextArea = React.forwardRef<HTMLTextAreaElement, TijarahTextAreaProps>(
  ({ tijarahVariant = "primary", heroVariant = "primary", label, className, id, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const selectedPreset = tijarahTextAreaVariants[tijarahVariant];

    return (
      <div className="w-full flex flex-col gap-1">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-xs font-medium text-text-primary"
          >
            {label}
          </label>
        )}
        <TextArea
          ref={ref}
          id={textareaId}
          {...props}
          variant={heroVariant}
          className={clsx(
            "w-full min-h-[72px] p-2.5 rounded-lg text-xs sm:text-sm transition-colors duration-150 outline-none resize-y",
            selectedPreset,
            className
          )}
        />
      </div>
    );
  }
);

TijarahTextArea.displayName = "TijarahTextArea";
