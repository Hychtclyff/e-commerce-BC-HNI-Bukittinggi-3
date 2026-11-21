import React from "react";
import { Checkbox, CheckboxProps } from "@heroui/react";
import clsx from "clsx";

const tijarahCheckboxVariants = {
  primary:
    "text-[var(--primary-sage)] border-[var(--border-subtle)] hover:border-[var(--primary-sage)]",
  secondary:
    "text-[var(--text-muted)] border-[var(--border-subtle)] hover:border-[var(--text-primary)]",
  error:
    "text-[var(--status-danger)] border-[var(--status-danger)] hover:brightness-95",
} as const satisfies Record<string, string>;

export type TijarahCheckboxVariant = keyof typeof tijarahCheckboxVariants;

export interface TijarahCheckboxProps extends Omit<CheckboxProps, "variant"> {
  tijarahVariant?: TijarahCheckboxVariant;
  label?: React.ReactNode;
}

export type ITijarahCheckboxProps = TijarahCheckboxProps;

const TijarahCheckboxRoot: React.FC<TijarahCheckboxProps> = ({
  tijarahVariant = "primary",
  label,
  className,
  children,
  ...props
}) => {
  const selectedPreset = tijarahCheckboxVariants[tijarahVariant];

  return (
    <Checkbox
      {...props}
      className={clsx(
        "inline-flex items-center gap-2 cursor-pointer text-sm sm:text-base text-slate-800 dark:text-slate-200 select-none",
        selectedPreset,
        className
      )}
    >
      <Checkbox.Control className="w-5 h-5 rounded border flex items-center justify-center transition-colors bg-[var(--surface)] border-[var(--border-subtle)]">
        <Checkbox.Indicator className="w-3.5 h-3.5 fill-current text-[var(--primary-sage)]">
          <svg viewBox="0 0 24 24" className="w-full h-full stroke-current stroke-[3] fill-none">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </Checkbox.Indicator>
      </Checkbox.Control>
      {(label || children) && (
        <Checkbox.Content className="text-slate-700 dark:text-slate-300 font-medium">
          {label || children}
        </Checkbox.Content>
      )}
    </Checkbox>
  );
};

export const TijarahCheckbox = Object.assign(TijarahCheckboxRoot, {
  Control: Checkbox.Control,
  Indicator: Checkbox.Indicator,
  Content: Checkbox.Content,
});
