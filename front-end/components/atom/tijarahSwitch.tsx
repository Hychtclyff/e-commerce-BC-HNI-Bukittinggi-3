"use client";

import React from "react";
import clsx from "clsx";

export interface TijarahSwitchProps {
  isSelected?: boolean;
  defaultSelected?: boolean;
  onChange?: (isSelected: boolean) => void;
  onValueChange?: (isSelected: boolean) => void;
  label?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
  id?: string;
  name?: string;
}

export type ITijarahSwitchProps = TijarahSwitchProps;

export const TijarahSwitch: React.FC<TijarahSwitchProps> = ({
  isSelected,
  defaultSelected = false,
  onChange,
  onValueChange,
  label,
  size = "md",
  disabled = false,
  className,
  "aria-label": ariaLabel,
  id,
  name,
}) => {
  const [internalSelected, setInternalSelected] = React.useState<boolean>(
    isSelected !== undefined ? isSelected : defaultSelected
  );

  const checked = isSelected !== undefined ? isSelected : internalSelected;
  const isSm = size === "sm";

  const handleChange = (nextVal: boolean) => {
    if (disabled) return;
    if (isSelected === undefined) {
      setInternalSelected(nextVal);
    }
    onChange?.(nextVal);
    onValueChange?.(nextVal);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      id={id}
      name={name}
      aria-label={ariaLabel || (typeof label === "string" ? label : "Toggle switch")}
      onClick={() => handleChange(!checked)}
      className={clsx(
        "inline-flex items-center gap-2 select-none cursor-pointer focus:outline-none",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <span
        className={clsx(
          "relative inline-flex items-center rounded-md transition-colors duration-150 shrink-0",
          isSm ? "w-8 h-4.5 p-0.5" : "w-10 h-5.5 p-0.5",
          checked
            ? "bg-primary-sage border border-primary-sage"
            : "bg-canvas hover:bg-border-subtle/70 border border-border-subtle"
        )}
      >
        <span
          className={clsx(
            "bg-white rounded-xs shadow-2xs transition-transform duration-150 block pointer-events-none transform",
            isSm
              ? clsx("w-3.5 h-3.5", checked ? "translate-x-3.5" : "translate-x-0")
              : clsx("w-4 h-4", checked ? "translate-x-4.5" : "translate-x-0")
          )}
        />
      </span>
      {label && (
        <span className="text-xs sm:text-sm font-medium text-text-primary">
          {label}
        </span>
      )}
    </button>
  );
};

export default TijarahSwitch;
