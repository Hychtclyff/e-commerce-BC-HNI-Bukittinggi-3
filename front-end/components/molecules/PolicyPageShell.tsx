import React from "react";
import { Link } from "@/lib/i18n/navigation";
import { ArrowLeft } from "lucide-react";

export interface PolicySection {
  heading: string;
  body: string[];
}

interface PolicyPageShellProps {
  badge: string;
  title: string;
  subtitle: string;
  updatedAt: string;
  sections: PolicySection[];
  backLabel: string;
}

export function PolicyPageShell({
  badge,
  title,
  subtitle,
  updatedAt,
  sections,
  backLabel,
}: PolicyPageShellProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <div className="space-y-3 border-b border-border-subtle pb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-primary-sage transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{backLabel}</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-primary-sage/10 text-primary-sage border border-primary-sage/20">
            {badge}
          </span>
          <span className="text-xs text-text-muted">{updatedAt}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
          {title}
        </h1>
        <p className="text-sm text-text-muted leading-relaxed">{subtitle}</p>
      </div>

      <div className="space-y-6">
        {sections.map((sec, idx) => (
          <section
            key={idx}
            className="rounded-2xl border border-border-subtle bg-surface p-5 sm:p-6 space-y-2.5"
          >
            <h2 className="text-base sm:text-lg font-bold text-text-primary">
              {sec.heading}
            </h2>
            <div className="space-y-2 text-sm text-text-muted leading-relaxed">
              {sec.body.map((p, pIdx) => (
                <p key={pIdx}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
