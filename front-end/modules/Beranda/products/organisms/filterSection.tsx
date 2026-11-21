import { Button } from "@heroui/react"
import { getTranslations } from "next-intl/server";

export const Filter = async () => {
    const t = await getTranslations("Products");

    return (
        <section className="flex flex-wrap items-center justify-center gap-2">
            <Button size="sm" className="rounded-full bg-primary-sage text-surface font-semibold px-4 shadow-xs">
                {t("filterAll")}
            </Button>
            <Button size="sm" variant="outline" className="rounded-full border-border-subtle text-text-primary hover:bg-surface font-medium px-4">
                {t("filterHealth")}
            </Button>
            <Button size="sm" variant="outline" className="rounded-full border-border-subtle text-text-primary hover:bg-surface font-medium px-4">
                {t("filterNutrition")}
            </Button>
            <Button size="sm" variant="outline" className="rounded-full border-border-subtle text-text-primary hover:bg-surface font-medium px-4">
                {t("filterBeverage")}
            </Button>
            <Button size="sm" variant="outline" className="rounded-full border-border-subtle text-text-primary hover:bg-surface font-medium px-4">
                {t("filterCare")}
            </Button>
        </section>
    )
}