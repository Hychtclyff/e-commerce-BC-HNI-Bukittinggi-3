import React from "react";
import { Select, SelectProps, ListBox, ListBoxItem, ListBoxItemProps } from "@heroui/react";
import clsx from "clsx";

const tijarahSelectVariants = {
  primary:
    "border-border-subtle bg-surface text-text-primary focus-within:!border-primary-sage focus-within:ring-1 focus-within:ring-primary-sage shadow-2xs",
  secondary:
    "border-border-subtle bg-canvas text-text-primary hover:bg-surface focus-within:!bg-surface focus-within:!border-primary-sage",
  error:
    "border-status-danger bg-[var(--badge-danger-bg)] text-status-danger focus-within:!border-status-danger focus-within:ring-1 focus-within:ring-status-danger",
} as const satisfies Record<string, string>;

export type TijarahSelectVariant = keyof typeof tijarahSelectVariants;

export interface TijarahSelectProps<T extends object = object>
  extends Omit<SelectProps<T>, "variant"> {
  tijarahVariant?: TijarahSelectVariant;
  heroVariant?: SelectProps<T>["variant"];
}

export type ITijarahSelectProps<T extends object = object> = TijarahSelectProps<T>;

const TijarahSelectRoot = <T extends object = object>({
  tijarahVariant = "primary",
  heroVariant = "primary",
  className,
  children,
  ...props
}: TijarahSelectProps<T>) => {
  const selectedPreset = tijarahSelectVariants[tijarahVariant];

  return (
    <Select
      {...props}
      variant={heroVariant}
      className={clsx(
        "w-full transition-colors duration-150 rounded-lg text-xs sm:text-sm border border-border-subtle",
        selectedPreset,
        className
      )}
    >
      <Select.Trigger className="w-full flex items-center justify-between px-3 py-1.5 h-8.5 text-xs sm:text-sm font-medium outline-none cursor-pointer bg-transparent border-none text-text-primary">
        <Select.Value className="text-left truncate flex-1" />
        <Select.Indicator className="shrink-0 text-text-muted ml-2" />
      </Select.Trigger>
      <Select.Popover className="bg-surface border border-border-subtle shadow-lg rounded-xl p-1 z-50 min-w-[200px] outline-none">
        <ListBox className="outline-none max-h-60 overflow-y-auto">{children}</ListBox>
      </Select.Popover>
    </Select>
  );
};

export const TijarahSelectItem: React.FC<ListBoxItemProps & { id?: React.Key }> = ({ className, children, id, ...props }) => (
  <ListBoxItem
    id={id ?? (props as any).textValue}
    className={clsx(
      "px-2.5 py-1.5 text-xs sm:text-sm rounded-lg cursor-pointer text-text-primary hover:bg-canvas focus:bg-canvas data-[selected=true]:bg-primary-sage/12 data-[selected=true]:text-primary-sage data-[selected=true]:font-semibold transition-colors outline-none",
      className
    )}
    {...props}
  >
    {children}
  </ListBoxItem>
);

export const TijarahSelect = Object.assign(TijarahSelectRoot, {
  Item: TijarahSelectItem,
});
