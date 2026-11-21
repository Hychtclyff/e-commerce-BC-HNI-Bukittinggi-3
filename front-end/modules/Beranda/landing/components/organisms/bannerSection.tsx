import { Link } from "@/lib/i18n/navigation"
import { Button, Chip } from "@heroui/react"
import { useTranslations } from "next-intl";

export const Banner = async () => {
    const t = useTranslations("Landing");

    return (
        <section
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-sage to-primary-dark text-white p-8 md:p-12 shadow-lg border border-white/10"
            aria-label="Stockist and partner benefits"
        >
            <div className="max-w-xl flex flex-col items-start gap-4 z-10 relative">
                <Chip
                    variant="soft"
                    className="text-xs font-semibold bg-accent-gold text-white border border-white/20"
                >
                    VIP &amp; STOCKIST PERKS
                </Chip>
                <h2 className="text-2xl md:text-3xl font-extrabold leading-tight text-white">
                    {t("bannerTitle")}
                </h2>
                <p className="text-sm md:text-base text-white/90 leading-relaxed">
                    {t("bannerSubtitle")}
                </p>
                <Link href="/login">
                    <Button
                        id="banner-cta-login"
                        size="lg"
                        className="bg-accent-gold hover:bg-accent-gold/90 text-white font-semibold shadow-md transition-all hover:scale-105"
                    >
                        {t("joinPartner")}
                    </Button>
                </Link>
            </div>
            <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-white/8 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-0 right-20 w-48 h-48 bg-accent-gold/15 rounded-full blur-2xl pointer-events-none" />
        </section>
    )
}