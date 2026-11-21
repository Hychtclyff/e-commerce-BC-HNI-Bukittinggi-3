import { getTranslations } from "next-intl/server";
import { FEATURES } from "../../const/data";

export async function FeaturesHighlight() {
    const t = await getTranslations("Landing");

    return (
        <section id="features" className="flex flex-col gap-10">
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text-primary">
                    {t("featuresTitle")}
                </h2>
                <p className="mt-3 text-sm md:text-base text-text-muted leading-relaxed">
                    {t("featuresSubtitle")}
                </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {FEATURES.map((feat, i) => (
                    <article
                        key={i}
                        className={`group relative flex flex-col gap-4 p-5 rounded-2xl bg-surface border border-border-subtle transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${feat.border} overflow-hidden`}
                    >
                        {/* Gradient background on hover */}
                        <div
                            className={`absolute inset-0 bg-gradient-to-br ${feat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`}
                        />

                        {/* Icon */}
                        <div
                            className={`relative z-10 flex h-11 w-11 items-center justify-center rounded-xl bg-canvas border border-border-subtle ${feat.accent} transition-colors duration-300 group-hover:bg-surface`}
                        >
                            {feat.icon}
                        </div>

                        {/* Content */}
                        <div className="relative z-10 flex flex-col gap-1.5">
                            <h3 className="font-bold text-text-primary text-sm leading-snug">
                                {t(feat.titleKey as never)}
                            </h3>
                            <p className="text-xs text-text-muted leading-relaxed">
                                {t(feat.descKey as never)}
                            </p>
                        </div>

                        {/* Corner accent number */}
                        <span className="absolute top-3 right-4 text-4xl font-black text-border-subtle/50 group-hover:text-border-subtle/80 transition-colors select-none">
                            {String(i + 1).padStart(2, "0")}
                        </span>
                    </article>
                ))}
            </div>
        </section>
    );
}
