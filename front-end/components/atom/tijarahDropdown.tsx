import React from "react";
import { Dropdown, DropdownProps, DropdownItemProps, DropdownMenuProps, DropdownSectionProps } from "@heroui/react";
import clsx from "clsx";

const tijarahDropdownVariants = {
  primary:
    "bg-surface border border-border-subtle shadow-lg rounded-xl p-1 text-text-primary",
  secondary:
    "bg-canvas border border-border-subtle shadow-md rounded-xl p-1 text-text-muted",
} as const satisfies Record<string, string>;

export type TijarahDropdownVariant = keyof typeof tijarahDropdownVariants;

export interface TijarahDropdownProps extends DropdownProps {
  tijarahVariant?: TijarahDropdownVariant;
}

const TijarahDropdownRoot: React.FC<TijarahDropdownProps> = ({ children, ...props }) => (
  <Dropdown {...props}>{children}</Dropdown>
);

export const TijarahDropdownPopover: React.FC<{ className?: string; tijarahVariant?: TijarahDropdownVariant; children?: React.ReactNode }> = ({
  tijarahVariant = "primary",
  className,
  children,
  ...props
}) => {
  const selectedPreset = tijarahDropdownVariants[tijarahVariant];
  return (
    <Dropdown.Popover
      className={clsx("min-w-[180px] outline-none transition-all", selectedPreset, className)}
      {...props}
    >
      {children}
    </Dropdown.Popover>
  );
};

export const TijarahDropdownItem: React.FC<DropdownItemProps> = ({ className, children, ...props }) => (
  <Dropdown.Item
    className={clsx(
      "px-3 py-2 text-xs sm:text-sm rounded-lg cursor-pointer flex items-center gap-2 text-text-primary hover:bg-canvas focus:bg-canvas transition-colors outline-none",
      className
    )}
    {...props}
  >
    {children}
  </Dropdown.Item>
);

export const TijarahDropdown = Object.assign(TijarahDropdownRoot, {
  Trigger: Dropdown.Trigger,
  Popover: TijarahDropdownPopover,
  Menu: Dropdown.Menu as <T extends object = object>(props: DropdownMenuProps<T>) => React.ReactElement,
  Section: Dropdown.Section as (props: DropdownSectionProps) => React.ReactElement,
  Item: TijarahDropdownItem,
});
