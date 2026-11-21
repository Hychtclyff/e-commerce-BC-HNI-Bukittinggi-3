import { Link } from "@/lib/i18n/navigation"
import { Button } from "@heroui/react"
import { getTranslations } from "next-intl/server";

export const Operational = async () => {
    const t = await getTranslations("About");

    return (
        <section className="rounded-3xl border border-border-subtle bg-canvas p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="flex flex-col gap-2 text-center md:text-left">
                <h3 className="text-lg font-bold text-text-primary">
                    {t("addressTitle")}
                </h3>
                <p className="text-sm text-text-muted max-w-md">
                    {t("addressDetail")}
                </p>
            </div>
            <Link href="/contact">
                <Button
                    size="lg"
                    className="rounded-full font-medium px-8 bg-primary-sage hover:bg-primary-dark text-surface transition-colors shadow-md whitespace-nowrap"
                >
                    {t("contactSupport")}
                </Button>
            </Link>
        </section >
    )
}