import React from "react";
import { Radio, RadioProps, RadioGroup, RadioGroupProps } from "@heroui/react";
import clsx from "clsx";

const tijarahRadioVariants = {
  primary:
    "text-[var(--primary-sage)] border-[var(--border-subtle)] hover:border-[var(--primary-sage)]",
  secondary:
    "text-[var(--text-muted)] border-[var(--border-subtle)] hover:border-[var(--text-primary)]",
  error:
    "text-[var(--status-danger)] border-[var(--status-danger)] hover:brightness-95",
} as const satisfies Record<string, string>;

export type TijarahRadioVariant = keyof typeof tijarahRadioVariants;

export interface TijarahRadioProps extends RadioProps {
  tijarahVariant?: TijarahRadioVariant;
  label?: React.ReactNode;
}

export type ITijarahRadioProps = TijarahRadioProps;

const TijarahRadioRoot: React.FC<TijarahRadioProps> = ({
  tijarahVariant = "primary",
  label,
  className,
  children,
  ...props
}) => {
  const selectedPreset = tijarahRadioVariants[tijarahVariant];

  return (
    <Radio
      {...props}
      className={clsx(
        "inline-flex items-center gap-2 cursor-pointer text-sm sm:text-base text-slate-800 dark:text-slate-200 select-none",
        selectedPreset,
        className
      )}
    >
      <Radio.Control className="w-5 h-5 rounded-full border flex items-center justify-center transition-colors bg-[var(--surface)] border-[var(--border-subtle)]">
        <Radio.Indicator className="w-2.5 h-2.5 rounded-full bg-[var(--primary-sage)]" />
      </Radio.Control>
      {(label || children) && (
        <Radio.Content className="text-[var(--text-primary)] font-medium">
          {label || children}
        </Radio.Content>
      )}
    </Radio>
  );
};

export interface TijarahRadioGroupProps extends RadioGroupProps {
  label?: React.ReactNode;
}

export type ITijarahRadioGroupProps = TijarahRadioGroupProps;

export const TijarahRadioGroup: React.FC<TijarahRadioGroupProps> = ({
  label,
  className,
  children,
  ...props
}) => (
  <RadioGroup {...props} className={clsx("flex flex-col gap-2.5", className)}>
    {(values) => (
      <>
        {label && (
          <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
            {label}
          </span>
        )}
        {typeof children === "function" ? children(values) : children}
      </>
    )}
  </RadioGroup>
);

export const TijarahRadioBtn = Object.assign(TijarahRadioRoot, {
  Group: TijarahRadioGroup,
  Control: Radio.Control,
  Indicator: Radio.Indicator,
  Content: Radio.Content,
});
