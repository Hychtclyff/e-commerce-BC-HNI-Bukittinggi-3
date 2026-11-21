"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { NewsProductSection } from "./NewsProductSection";

export interface AuthLayoutProps {
    children: React.ReactNode;
}

import { Navbar } from '@/components/navbar';

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const t = useTranslations("Auth");

  return (
    <div className="relative min-h-screen w-full flex flex-col">
      <Navbar />
      <div className="relative flex-1 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 bg-canvas">
            {/* Background Ambient Glows */}
            <div className="absolute inset-0 pointer-events-none z-0 w-full h-full overflow-hidden">
                {/* Glow Kiri Atas */}
                <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-primary-sage/10 blur-3xl" />

                {/* Glow Kanan Bawah */}
                <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-accent-gold/10 blur-3xl" />
            </div>

            <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
                {/* Left Column: Branding Showcase & News Product Carousel */}
                <div className="lg:col-span-6 flex flex-col justify-center gap-6 text-left">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-primary-sage/10 text-primary-sage border border-primary-sage/20 shadow-xs">
                            <span className="w-2 h-2 rounded-full bg-primary-sage animate-pulse" />
                            {t("showcaseBadge")}
                        </div>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-text-primary tracking-tight leading-tight">
                            {t("showcaseTitle")}
                        </h1>

                        <p className="text-sm sm:text-base text-text-muted leading-relaxed max-w-lg">
                            {t("showcaseSubtitle")}
                        </p>
                    </div>

                    {/* Highlight Features */}
                    <div className="flex flex-wrap gap-2 pt-1">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-surface border border-border-subtle text-text-primary shadow-xs">
                            {t("feature1")}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-surface border border-border-subtle text-text-primary shadow-xs">
                            {t("feature2")}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-surface border border-border-subtle text-text-primary shadow-xs">
                            {t("feature3")}
                        </span>
                    </div>

                    {/* News & Product Showcase Carousel */}
                    <div className="pt-2">
                        <NewsProductSection />
                    </div>
                </div>

                {/* Right Column: Dynamic Form Card (Login / Register / Verify Email) */}
                <div className="lg:col-span-6 max-w-md mx-auto w-full lg:max-w-none">
                    {children}
                </div>
            </div>
      </div>
    </div>
  );
};

// Alias for backwards compatibility
export const LayoutAuth = AuthLayout;
export default AuthLayout;
