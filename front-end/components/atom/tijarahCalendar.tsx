"use client";

import React from "react";
import { Calendar as HeroCalendar } from "@heroui/react";
import clsx from "clsx";

export interface ITijarahCalendarProps {
  value?: any;
  onChange?: (val: any) => void;
  className?: string;
  isReadOnly?: boolean;
}

export const TijarahCalendar: React.FC<ITijarahCalendarProps> = ({
  value,
  onChange,
  className,
  isReadOnly = false,
  ...props
}) => {
  return (
    <div
      className={clsx(
        "p-3 rounded-xl border border-border-subtle bg-surface text-text-primary shadow-2xs inline-block",
        className
      )}
    >
      <HeroCalendar
        value={value}
        onChange={onChange}
        isReadOnly={isReadOnly}
        className="w-full text-text-primary"
        {...props}
      />
    </div>
  );
};

export default TijarahCalendar;
