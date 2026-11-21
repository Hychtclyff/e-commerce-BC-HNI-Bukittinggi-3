import { Card } from "@heroui/react"
import { getTranslations } from "next-intl/server";

export const Statistics = async () => {
    const t = await getTranslations("About");

    return (
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="p-6 text-center border border-border-subtle bg-surface shadow-sm rounded-2xl">
                <span className="text-3xl font-extrabold text-primary-sage">2.500+</span>
                <p className="text-sm font-semibold text-text-primary mt-1">{t("statsAgents")}</p>
            </Card>
            <Card className="p-6 text-center border border-border-subtle bg-surface shadow-sm rounded-2xl">
                <span className="text-3xl font-extrabold text-accent-gold">100.000+ TP</span>
                <p className="text-sm font-semibold text-text-primary mt-1">{t("statsPoints")}</p>
            </Card>
            <Card className="p-6 text-center border border-border-subtle bg-surface shadow-sm rounded-2xl">
                <span className="text-3xl font-extrabold text-primary-sage">L300 & Kargo</span>
                <p className="text-sm font-semibold text-text-primary mt-1">{t("statsCoverage")}</p>
                <p className="text-xs text-text-muted">{t("statsCoverageDesc")}</p>
            </Card>
        </section>
    )
}