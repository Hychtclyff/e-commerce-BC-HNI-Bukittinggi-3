"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import clsx from "clsx";

export type SheetSide = "right" | "left" | "bottom";
export type SheetSize = "sm" | "md" | "lg" | "xl" | "full";

export interface TijarahSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  side?: SheetSide;
  size?: SheetSize;
  showCloseButton?: boolean;
  className?: string;
  closeOnOverlayClick?: boolean;
}

const sizeClasses: Record<SheetSide, Record<SheetSize, string>> = {
  right: {
    sm: "w-full sm:w-[380px] max-w-full sm:max-w-sm",
    md: "w-full sm:w-[460px] max-w-full sm:max-w-md",
    lg: "w-full sm:w-[540px] max-w-full sm:max-w-lg",
    xl: "w-full sm:w-[640px] max-w-full sm:max-w-xl",
    full: "w-full max-w-full",
  },
  left: {
    sm: "w-full sm:w-[380px] max-w-full sm:max-w-sm",
    md: "w-full sm:w-[460px] max-w-full sm:max-w-md",
    lg: "w-full sm:w-[540px] max-w-full sm:max-w-lg",
    xl: "w-full sm:w-[640px] max-w-full sm:max-w-xl",
    full: "w-full max-w-full",
  },
  bottom: {
    sm: "w-full h-[40vh] max-h-[40vh]",
    md: "w-full h-[60vh] max-h-[60vh]",
    lg: "w-full h-[80vh] max-h-[80vh]",
    xl: "w-full h-[90vh] max-h-[90vh]",
    full: "w-full h-full max-h-screen",
  },
};

export const TijarahSheet: React.FC<TijarahSheetProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  side = "right",
  size = "md",
  showCloseButton = true,
  className,
  closeOnOverlayClick = true,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle ESC key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  const getMotionVariants = () => {
    if (side === "right") {
      return {
        initial: { x: "100%", opacity: 0.8 },
        animate: { x: 0, opacity: 1 },
        exit: { x: "100%", opacity: 0.8 },
      };
    }
    if (side === "left") {
      return {
        initial: { x: "-100%", opacity: 0.8 },
        animate: { x: 0, opacity: 1 },
        exit: { x: "-100%", opacity: 0.8 },
      };
    }
    return {
      initial: { y: "100%", opacity: 0.8 },
      animate: { y: 0, opacity: 1 },
      exit: { y: "100%", opacity: 0.8 },
    };
  };

  const getPositionClasses = () => {
    if (side === "right") {
      return "top-0 right-0 bottom-0 h-screen h-[100dvh] max-h-screen border-l";
    }
    if (side === "left") {
      return "top-0 left-0 bottom-0 h-screen h-[100dvh] max-h-screen border-r";
    }
    return "bottom-0 left-0 right-0 w-full border-t rounded-t-3xl";
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-sm"
            onClick={closeOnOverlayClick ? onClose : undefined}
          />

          {/* Sheet Container */}
          <motion.div
            {...getMotionVariants()}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={clsx(
              "fixed z-[10000] flex flex-col bg-surface border-border-subtle shadow-2xl overflow-hidden",
              getPositionClasses(),
              sizeClasses[side][size],
              className
            )}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-border-subtle shrink-0 bg-surface">
                <div className="flex items-center gap-3 min-w-0">
                  {icon && (
                    <div className="w-10 h-10 rounded-xl bg-primary-sage/15 text-primary-sage flex items-center justify-center shrink-0">
                      {icon}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    {title && (
                      <h3 className="text-base sm:text-lg font-black text-text-primary tracking-tight truncate">
                        {title}
                      </h3>
                    )}
                    {description && (
                      <p className="text-xs text-text-muted mt-0.5 leading-relaxed line-clamp-1">
                        {description}
                      </p>
                    )}
                  </div>
                </div>

                {showCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-canvas transition-colors cursor-pointer shrink-0"
                    aria-label="Tutup"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 bg-surface">
              {children}
            </div>

            {/* Sticky Footer */}
            {footer && (
              <div className="p-4 sm:p-6 border-t border-border-subtle bg-surface/95 backdrop-blur-xs shrink-0 shadow-xs">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default TijarahSheet;
