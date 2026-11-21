"use client";

import React, { useState, useRef, useEffect } from "react";
import { TijarahButton } from "./tijarahButton";
import { Calendar as CalendarIcon, X, ChevronLeft, ChevronRight, Check } from "lucide-react";
import clsx from "clsx";

export interface DateRangeValue {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface ITijarahDateRangePickerProps {
  value?: DateRangeValue;
  onChange: (range: DateRangeValue) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  align?: "left" | "right";
}

function formatDateDisplay(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  } catch {
    return dateStr;
  }
}

function toYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const TijarahDateRangePicker: React.FC<ITijarahDateRangePickerProps> = ({
  value,
  onChange,
  onClear,
  placeholder = "Pilih Rentang Tanggal",
  className,
  size = "sm",
  align = "right",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Month navigation state
  const [viewDate, setViewDate] = useState(() => {
    if (value?.startDate) return new Date(value.startDate);
    return new Date();
  });

  const [tempStart, setTempStart] = useState<string>(value?.startDate || "");
  const [tempEnd, setTempEnd] = useState<string>(value?.endDate || "");

  useEffect(() => {
    setTempStart(value?.startDate || "");
    setTempEnd(value?.endDate || "");
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleDayClick = (day: number) => {
    const clickedDateStr = toYMD(new Date(year, month, day));

    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(clickedDateStr);
      setTempEnd("");
    } else if (tempStart && !tempEnd) {
      if (new Date(clickedDateStr) < new Date(tempStart)) {
        setTempEnd(tempStart);
        setTempStart(clickedDateStr);
      } else {
        setTempEnd(clickedDateStr);
      }
    }
  };

  const applyPreset = (preset: "today" | "last7" | "last30" | "thisMonth" | "lastMonth") => {
    const now = new Date();
    const todayStr = toYMD(now);
    let start = "";
    let end = todayStr;

    if (preset === "today") {
      start = todayStr;
      end = todayStr;
    } else if (preset === "last7") {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      start = toYMD(d);
    } else if (preset === "last30") {
      const d = new Date();
      d.setDate(d.getDate() - 29);
      start = toYMD(d);
    } else if (preset === "thisMonth") {
      start = toYMD(new Date(now.getFullYear(), now.getMonth(), 1));
      end = toYMD(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    } else if (preset === "lastMonth") {
      start = toYMD(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      end = toYMD(new Date(now.getFullYear(), now.getMonth(), 0));
    }

    setTempStart(start);
    setTempEnd(end);
    onChange({ startDate: start, endDate: end });
    setIsOpen(false);
  };

  const handleApply = () => {
    if (tempStart) {
      const finalEnd = tempEnd || tempStart;
      onChange({ startDate: tempStart, endDate: finalEnd });
      setIsOpen(false);
    }
  };

  const handleReset = () => {
    setTempStart("");
    setTempEnd("");
    if (onClear) {
      onClear();
    } else {
      onChange({ startDate: "", endDate: "" });
    }
    setIsOpen(false);
  };

  const hasSelection = Boolean(value?.startDate || value?.endDate);
  const displayLabel = hasSelection
    ? `${formatDateDisplay(value?.startDate)} - ${formatDateDisplay(value?.endDate || value?.startDate)}`
    : placeholder;

  return (
    <div className={clsx("relative inline-block text-left", className)} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl border border-border-subtle bg-surface text-text-primary transition-all shadow-sm cursor-pointer",
          "hover:border-primary-sage/60 focus:outline-none focus:ring-1 focus:ring-primary-sage",
          size === "sm" ? "h-8 text-xs" : "h-9.5 text-sm",
          hasSelection && "border-primary-sage/40 bg-primary-sage/5 font-bold"
        )}
      >
        <div className="flex items-center gap-1.5 truncate">
          <CalendarIcon className="w-3.5 h-3.5 text-primary-sage shrink-0" />
          <span className="truncate">{displayLabel}</span>
        </div>

        {hasSelection && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              handleReset();
            }}
            className="w-4 h-4 rounded-full hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-text-muted hover:text-text-primary"
            title="Hapus filter tanggal"
          >
            <X className="w-3 h-3" />
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className={clsx(
          "absolute z-50 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] p-4 rounded-2xl bg-surface border border-border-subtle shadow-2xl space-y-3.5 animate-in fade-in zoom-in-95 duration-150",
          align === "right" ? "right-0" : "left-0"
        )}>
          {/* Header Quick Presets */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
            <button
              type="button"
              onClick={() => applyPreset("today")}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-canvas hover:bg-primary-sage/15 hover:text-primary-sage text-text-muted transition-colors shrink-0"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => applyPreset("last7")}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-canvas hover:bg-primary-sage/15 hover:text-primary-sage text-text-muted transition-colors shrink-0"
            >
              7 Hari
            </button>
            <button
              type="button"
              onClick={() => applyPreset("last30")}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-canvas hover:bg-primary-sage/15 hover:text-primary-sage text-text-muted transition-colors shrink-0"
            >
              30 Hari
            </button>
            <button
              type="button"
              onClick={() => applyPreset("thisMonth")}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-canvas hover:bg-primary-sage/15 hover:text-primary-sage text-text-muted transition-colors shrink-0"
            >
              Bulan Ini
            </button>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between px-1">
            <span className="font-bold text-xs text-text-primary">
              {monthNames[month]} {year}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-7 h-7 rounded-lg hover:bg-canvas flex items-center justify-center text-text-muted transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-7 h-7 rounded-lg hover:bg-canvas flex items-center justify-center text-text-muted transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="space-y-1">
            {/* Weekdays */}
            <div className="grid grid-cols-7 text-center text-[10px] font-bold text-text-muted uppercase">
              <span>Min</span>
              <span>Sen</span>
              <span>Sel</span>
              <span>Rab</span>
              <span>Kam</span>
              <span>Jum</span>
              <span>Sab</span>
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-1 text-xs">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="h-7" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dStr = toYMD(new Date(year, month, day));
                const isStart = tempStart === dStr;
                const isEnd = tempEnd === dStr;
                const isInRange =
                  tempStart &&
                  tempEnd &&
                  new Date(dStr) >= new Date(tempStart) &&
                  new Date(dStr) <= new Date(tempEnd);

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayClick(day)}
                    className={clsx(
                      "h-7 rounded-lg flex items-center justify-center font-semibold transition-colors text-xs",
                      isStart || isEnd
                        ? "bg-primary-sage text-white font-bold shadow-sm"
                        : isInRange
                        ? "bg-primary-sage/20 text-primary-sage font-bold"
                        : "hover:bg-canvas text-text-primary"
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-xs">
            <button
              type="button"
              onClick={handleReset}
              className="text-status-danger hover:underline font-bold text-[11px]"
            >
              Reset
            </button>

            <div className="flex items-center gap-2">
              <TijarahButton
                type="button"
                heroVariant="secondary"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-[11px] h-7 px-2.5 font-semibold"
              >
                Batal
              </TijarahButton>
              <TijarahButton
                type="button"
                tijarahVariant="primary"
                size="sm"
                onClick={handleApply}
                isDisabled={!tempStart}
                className="text-[11px] h-7 px-3 font-bold"
              >
                Terapkan
              </TijarahButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TijarahDateRangePicker;
