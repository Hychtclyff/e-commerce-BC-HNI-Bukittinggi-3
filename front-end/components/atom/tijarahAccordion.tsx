"use client";

import React from "react";
import {
  Accordion as HeroAccordion,
  AccordionItem as HeroAccordionItem,
  AccordionTrigger as HeroAccordionTrigger,
  AccordionPanel as HeroAccordionPanel,
  AccordionBody as HeroAccordionBody,
  AccordionHeading as HeroAccordionHeading,
} from "@heroui/react";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";

export interface TijarahAccordionItem {
  id: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  content: React.ReactNode;
}

export type ITijarahAccordionItem = TijarahAccordionItem;

export interface TijarahAccordionProps {
  items?: TijarahAccordionItem[];
  defaultExpandedKeys?: string[];
  className?: string;
  itemClassName?: string;
  children?: React.ReactNode;
}

export type ITijarahAccordionProps = TijarahAccordionProps;

export const TijarahAccordion: React.FC<TijarahAccordionProps> = ({
  items,
  defaultExpandedKeys,
  className,
  itemClassName,
  children,
}) => {
  if (!items) {
    return (
      <HeroAccordion
        className={clsx("flex flex-col gap-2.5 w-full", className)}
      >
        {children}
      </HeroAccordion>
    );
  }

  return (
    <HeroAccordion
      className={clsx("flex flex-col gap-2.5 w-full", className)}
    >
      {items.map((item) => (
        <HeroAccordionItem
          key={item.id}
          id={item.id}
          className={clsx(
            "group rounded-xl border border-border-subtle bg-surface overflow-hidden transition-colors duration-150",
            itemClassName
          )}
        >
          <HeroAccordionHeading>
            <HeroAccordionTrigger className="w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer transition-colors hover:bg-canvas/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-sage">
              <div className="flex items-center gap-3">
                {item.icon && (
                  <div className="w-7 h-7 rounded-lg bg-[var(--badge-primary-bg)] text-[var(--badge-primary-text)] border border-[var(--badge-primary-border)] flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-text-primary">
                      {item.title}
                    </span>
                    {item.badge}
                  </div>
                  {item.subtitle && (
                    <p className="text-xs text-text-muted mt-0.5">
                      {item.subtitle}
                    </p>
                  )}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-text-muted shrink-0 transition-transform duration-200 group-data-[expanded=true]:rotate-180" />
            </HeroAccordionTrigger>
          </HeroAccordionHeading>

          <HeroAccordionPanel>
            <HeroAccordionBody className="p-4 pt-1 text-xs text-text-primary border-t border-border-subtle/50 bg-canvas/40">
              {item.content}
            </HeroAccordionBody>
          </HeroAccordionPanel>
        </HeroAccordionItem>
      ))}
    </HeroAccordion>
  );
};
