import React from "react";
import { Label, LabelProps } from "@heroui/react";
import clsx from "clsx";

const tijarahLabelVariants = {
  default: "text-slate-700 dark:text-slate-200 font-medium",
  subtle: "text-slate-500 dark:text-slate-400 font-normal",
  error: "text-red-600 dark:text-red-400 font-medium",
} as const satisfies Record<string, string>;

export type TijarahLabelVariant = keyof typeof tijarahLabelVariants;

export interface TijarahLabelProps extends LabelProps {
  tijarahVariant?: TijarahLabelVariant;
}

export const TijarahLabel: React.FC<TijarahLabelProps> = ({
  tijarahVariant = "default",
  isRequired,
  isInvalid,
  className,
  children,
  ...props
}) => {
  const activeVariant = isInvalid ? "error" : tijarahVariant;
  const selectedPreset = tijarahLabelVariants[activeVariant];

  return (
    <Label
      isRequired={isRequired}
      isInvalid={isInvalid}
      className={clsx(
        "text-xs sm:text-sm inline-flex items-center gap-1 select-none",
        selectedPreset,
        className
      )}
      {...props}
    >
      {children}
      {isRequired && <span className="text-red-500 font-bold ml-0.5">*</span>}
    </Label>
  );
};
