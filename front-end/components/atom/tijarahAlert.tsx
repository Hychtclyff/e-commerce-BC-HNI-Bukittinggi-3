import React from "react";
import { Alert, AlertProps } from "@heroui/react";
import clsx from "clsx";

const tijarahAlertVariants = {
  info:
    "bg-canvas border-border-subtle text-text-primary",
  success:
    "bg-[var(--badge-success-bg)] border-status-success/30 text-status-success",
  warning:
    "bg-[var(--badge-warning-bg)] border-status-warning/30 text-status-warning",
  danger:
    "bg-[var(--badge-danger-bg)] border-status-danger/30 text-status-danger",
} as const satisfies Record<string, string>;

export type TijarahAlertVariant = keyof typeof tijarahAlertVariants;

export interface TijarahAlertProps extends Omit<AlertProps, "status" | "children"> {
  tijarahVariant?: TijarahAlertVariant;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export type ITijarahAlertProps = TijarahAlertProps;

const TijarahAlertRoot: React.FC<TijarahAlertProps> = ({
  tijarahVariant = "info",
  title,
  description,
  icon,
  className,
  children,
  ...props
}) => {
  const selectedPreset = tijarahAlertVariants[tijarahVariant];

  return (
    <Alert
      {...props}
      className={clsx(
        "px-3.5 py-2.5 rounded-lg border flex items-start gap-2.5 text-xs sm:text-sm transition-colors",
        selectedPreset,
        className
      )}
    >
      {icon && <Alert.Indicator>{icon}</Alert.Indicator>}
      {(title || description) ? (
        <Alert.Content className="flex flex-col gap-1">
          {title && <Alert.Title className="font-semibold">{title}</Alert.Title>}
          {description && <Alert.Description className="text-xs sm:text-sm opacity-90">{description}</Alert.Description>}
          {children}
        </Alert.Content>
      ) : (
        children
      )}
    </Alert>
  );
};

export const TijarahAlert = Object.assign(TijarahAlertRoot, {
  Indicator: Alert.Indicator,
  Content: Alert.Content,
  Title: Alert.Title,
  Description: Alert.Description,
});
