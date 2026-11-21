"use client";

import { TijarahButton, TijarahButtonVariant } from "@/components/atom/tijarahButton";
import { Link } from "@/lib/i18n/navigation";
import clsx from "clsx";
import { event } from "@/lib/analytics";

interface AuthCTAButtonProps {
    mode: "login" | "register";
    variant?: "primary" | "secondary" | "outline";
    size?: "sm" | "md" | "lg";
    label: string;
    sourceLocation: string; // misal: "hero_section", "navbar", "promo_banner"
    className?: string;
}

export const AuthCTAButton = ({
    mode,
    variant = "primary",
    size = "lg",
    label,
    sourceLocation,
    className,
}: AuthCTAButtonProps) => {
    const targetHref = mode === "register" ? "/register" : "/login";

    const handleClick = () => {
        event(mode === "register" ? "click_cta_register" : "click_cta_login", {
            event_category: "User Acquisition",
            event_label: sourceLocation,
            source: sourceLocation,
        });
    };

    const tijarahVariantMap: Record<string, TijarahButtonVariant> = {
        primary: "primary",
        secondary: "gold",
        outline: "outline",
    };

    return (
        <Link href={targetHref} onClick={handleClick}>
            <TijarahButton
                tijarahVariant={tijarahVariantMap[variant] || "primary"}
                size={size}
                className={clsx(
                    "rounded-full font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
                    className
                )}
            >
                {label}
            </TijarahButton>
        </Link>
    );
};