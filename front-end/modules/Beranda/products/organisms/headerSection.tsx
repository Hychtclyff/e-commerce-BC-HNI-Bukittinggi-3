import { Chip } from "@heroui/react"
import { title, subtitle } from "@/components/primitives";
import { getTranslations } from "next-intl/server";

export const Header = async () => {
    const t = await getTranslations("Products");
    return (
        <section className="flex flex-col items-center text-center max-w-3xl mx-auto gap-4">
            <Chip
                variant="soft"
                color="accent"
                className="text-xs uppercase font-medium px-3 py-1 bg-accent-gold/15 text-accent-gold border border-accent-gold/30"
            >
                {t("badge")}
            </Chip>

            <h1 className={title({ size: "lg" })}>
                <span className="text-text-primary">{t("title")}</span>&nbsp;
                <span className="text-primary-sage font-extrabold">{t("highlight")}</span>
            </h1>

            <p className={subtitle({ class: "text-text-muted max-w-2xl text-base leading-relaxed" })}>
                {t("subtitle")}
            </p>
        </section>
    )
}