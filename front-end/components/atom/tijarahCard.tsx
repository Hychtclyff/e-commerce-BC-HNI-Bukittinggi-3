import React from "react";
import { Card, CardProps, CardHeaderProps, CardTitleProps, CardDescriptionProps, CardContentProps, CardFooterProps } from "@heroui/react";
import clsx from "clsx";

const tijarahCardVariants = {
  default:
    "bg-surface border border-border-subtle shadow-2xs text-text-primary",
  bordered:
    "bg-surface border border-border-subtle text-text-primary",
  flat:
    "bg-canvas border border-border-subtle/80 text-text-primary",
  elevated:
    "bg-surface border border-border-subtle shadow-sm text-text-primary",
} as const satisfies Record<string, string>;

export type TijarahCardVariant = keyof typeof tijarahCardVariants;

export interface TijarahCardProps extends CardProps {
  tijarahVariant?: TijarahCardVariant;
}

export type ITijarahCardProps = TijarahCardProps;

const TijarahCardRoot: React.FC<TijarahCardProps> = ({
  tijarahVariant = "default",
  className,
  children,
  ...props
}) => {
  const selectedPreset = tijarahCardVariants[tijarahVariant];

  return (
    <Card
      {...props}
      className={clsx("!rounded-xl transition-colors duration-150 overflow-hidden", selectedPreset, className)}
    >
      {children}
    </Card>
  );
};

export const TijarahCardHeader: React.FC<CardHeaderProps> = ({ className, children, ...props }) => (
  <Card.Header
    className={clsx(
      "px-4 py-3 border-b border-border-subtle flex flex-col gap-0.5 bg-surface",
      className
    )}
    {...props}
  >
    {children}
  </Card.Header>
);

export const TijarahCardTitle: React.FC<CardTitleProps> = ({ className, children, ...props }) => (
  <Card.Title
    className={clsx("text-sm sm:text-base font-semibold tracking-tight text-text-primary", className)}
    {...props}
  >
    {children}
  </Card.Title>
);

export const TijarahCardDescription: React.FC<CardDescriptionProps> = ({ className, children, ...props }) => (
  <Card.Description
    className={clsx("text-xs text-text-muted", className)}
    {...props}
  >
    {children}
  </Card.Description>
);

export const TijarahCardContent: React.FC<CardContentProps> = ({ className, children, ...props }) => (
  <Card.Content className={clsx("p-4 text-xs sm:text-sm", className)} {...props}>
    {children}
  </Card.Content>
);

export const TijarahCardFooter: React.FC<CardFooterProps> = ({ className, children, ...props }) => (
  <Card.Footer
    className={clsx(
      "px-4 py-3 border-t border-border-subtle flex items-center justify-between gap-3 bg-canvas/60",
      className
    )}
    {...props}
  >
    {children}
  </Card.Footer>
);

export const TijarahCard = Object.assign(TijarahCardRoot, {
  Header: TijarahCardHeader,
  Title: TijarahCardTitle,
  Description: TijarahCardDescription,
  Content: TijarahCardContent,
  Body: TijarahCardContent,
  Footer: TijarahCardFooter,
});
