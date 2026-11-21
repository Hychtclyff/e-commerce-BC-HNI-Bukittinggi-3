import { getTranslations } from "next-intl/server";
import { Truck, ShieldCheck, Zap, CreditCard } from "lucide-react";

export const Propositions = async () => {
    const t = await getTranslations("Landing");

    return (
        <section
            aria-label="Value propositions"
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-5 rounded-2xl bg-surface border border-border-subtle shadow-none"
        >
            {[
                { icon: Truck, title: t("badgeShippingTitle"), desc: t("badgeShippingDesc") },
                { icon: ShieldCheck, title: t("badgeOriginalTitle"), desc: t("badgeOriginalDesc") },
                { icon: Zap, title: t("badgeHsisTitle"), desc: t("badgeHsisDesc") },
                { icon: CreditCard, title: t("badgeKasbonTitle"), desc: t("badgeKasbonDesc") },
            ].map((badge, i) => {
                const IconComponent = badge.icon;
                return (
                    <div key={i} className="flex flex-col items-center text-center p-3 gap-1 group">
                        <div className="w-10 h-10 rounded-xl bg-primary-sage/10 text-primary-sage flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                            <IconComponent className="w-5 h-5 stroke-[1.8]" />
                        </div>
                        <h4 className="font-semibold text-xs sm:text-sm text-text-primary leading-snug">{badge.title}</h4>
                        <p className="text-xs text-text-muted mt-0.5 leading-snug">{badge.desc}</p>
                    </div>
                );
            })}
        </section>

    )
}