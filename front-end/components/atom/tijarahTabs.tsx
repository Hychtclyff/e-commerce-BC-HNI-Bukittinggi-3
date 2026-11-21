"use client";

import React, { useState } from "react";
import {
  Tabs as HeroTabs,
  TabList as HeroTabList,
  Tab as HeroTab,
  TabPanel as HeroTabPanel,
} from "@heroui/react";
import clsx from "clsx";

export type TijarahTabsVariant = "segmented" | "underline" | "pills";

export interface TijarahTabItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  content?: React.ReactNode;
  disabled?: boolean;
}

export type ITijarahTabItem = TijarahTabItem;

export interface TijarahTabsProps {
  items?: TijarahTabItem[];
  selectedKey?: string;
  defaultSelectedKey?: string;
  onSelectionChange?: (key: string) => void;
  variant?: TijarahTabsVariant;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  className?: string;
  listClassName?: string;
  panelClassName?: string;
  children?: React.ReactNode;
}

export type ITijarahTabsProps = TijarahTabsProps;

export interface TijarahTabProps {
  id: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  variant?: TijarahTabsVariant;
}

export type ITijarahTabProps = TijarahTabProps;

export interface TijarahTabPanelProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export type ITijarahTabPanelProps = TijarahTabPanelProps;

export const TijarahTabList: React.FC<{
  children: React.ReactNode;
  variant?: TijarahTabsVariant;
  className?: string;
}> = ({ children, variant = "segmented", className }) => {
  const containerStyle =
    variant === "segmented"
      ? "inline-flex p-1 rounded-xl bg-canvas border border-border-subtle gap-1"
      : variant === "underline"
      ? "flex border-b border-border-subtle gap-4"
      : "flex flex-wrap gap-1.5";

  return (
    <HeroTabList className={clsx(containerStyle, className)}>
      {children}
    </HeroTabList>
  );
};

export const TijarahTab: React.FC<TijarahTabProps> = ({
  id,
  children,
  icon,
  badge,
  disabled,
  className,
  variant = "segmented",
}) => {
  const baseClasses =
    "inline-flex items-center justify-center gap-1.5 font-medium text-xs transition-colors duration-150 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-sage disabled:cursor-not-allowed disabled:opacity-40";

  const variantClasses =
    variant === "segmented"
      ? "px-3 py-1.5 rounded-lg text-text-muted hover:text-text-primary data-[selected=true]:bg-surface data-[selected=true]:text-text-primary data-[selected=true]:font-semibold data-[selected=true]:shadow-2xs data-[selected=true]:border data-[selected=true]:border-border-subtle"
      : variant === "underline"
      ? "pb-2 pt-1 px-1 text-text-muted border-b-2 border-transparent hover:text-text-primary data-[selected=true]:border-primary-sage data-[selected=true]:text-primary-sage data-[selected=true]:font-semibold"
      : "px-3 py-1.5 rounded-lg border border-border-subtle bg-surface text-text-muted hover:bg-canvas hover:text-text-primary data-[selected=true]:border-primary-sage/40 data-[selected=true]:bg-[var(--badge-primary-bg)] data-[selected=true]:text-[var(--badge-primary-text)] data-[selected=true]:font-semibold";

  return (
    <HeroTab
      id={id}
      isDisabled={disabled}
      className={clsx(baseClasses, variantClasses, className)}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
      {badge && <span className="ml-1 shrink-0">{badge}</span>}
    </HeroTab>
  );
};

export const TijarahTabPanel: React.FC<TijarahTabPanelProps> = ({
  id,
  children,
  className,
}) => {
  return (
    <HeroTabPanel id={id} className={clsx("outline-none pt-4", className)}>
      {children}
    </HeroTabPanel>
  );
};

export const TijarahTabs: React.FC<TijarahTabsProps> = ({
  items,
  selectedKey: controlledKey,
  defaultSelectedKey,
  onSelectionChange,
  variant = "segmented",
  className,
  listClassName,
  panelClassName,
  children,
}) => {
  const initialKey = defaultSelectedKey || (items && items[0]?.id) || "";
  const [internalKey, setInternalKey] = useState<string>(initialKey);

  const activeKey = controlledKey !== undefined ? controlledKey : internalKey;

  const handleSelectionChange = (key: any) => {
    const stringKey = String(key);
    if (controlledKey === undefined) {
      setInternalKey(stringKey);
    }
    onSelectionChange?.(stringKey);
  };

  if (!items) {
    return (
      <HeroTabs
        selectedKey={activeKey}
        onSelectionChange={handleSelectionChange}
        className={clsx("w-full flex flex-col", className)}
      >
        {children}
      </HeroTabs>
    );
  }

  return (
    <HeroTabs
      selectedKey={activeKey}
      onSelectionChange={handleSelectionChange}
      className={clsx("w-full flex flex-col", className)}
    >
      <TijarahTabList variant={variant} className={listClassName}>
        {items.map((item) => (
          <TijarahTab
            key={item.id}
            id={item.id}
            icon={item.icon}
            badge={item.badge}
            disabled={item.disabled}
            variant={variant}
          >
            {item.label}
          </TijarahTab>
        ))}
      </TijarahTabList>

      {items.map((item) =>
        item.content ? (
          <TijarahTabPanel
            key={item.id}
            id={item.id}
            className={panelClassName}
          >
            {item.content}
          </TijarahTabPanel>
        ) : null
      )}
    </HeroTabs>
  );
};

export const TabsTijarah = TijarahTabs;
export type ITabsTijarahProps = TijarahTabsProps;
