import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@heroui/react";
import { Link } from "@/lib/i18n/navigation";
import { ArrowRight, ShoppingBag, Users } from "lucide-react";

export async function CTASection() {
    const t = await getTranslations("Landing");
    const locale = await getLocale();
    const isEn = locale === "en";

    return (
        <section
            id="cta"
            className="w-screen relative left-1/2 -translate-x-1/2 bg-[#1e3a2d] text-white border-t border-white/10"
        >
            <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-14">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-stretch">
                    {/* LEFT - Consumer CTA */}
                    <div className="flex flex-col justify-between gap-6 lg:pr-10 lg:border-r lg:border-white/15">
                        <div className="space-y-3">
                            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/75">
                                <ShoppingBag className="w-4 h-4 text-accent-gold" />
                                {isEn ? "Consumer Shopping" : "Belanja Konsumen"}
                            </span>
                            <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                                {t("ctaConsumerTitle")}
                            </h3>
                            <p className="text-sm text-white/80 leading-relaxed max-w-md">
                                {t("ctaConsumerDesc")}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link href="/shop">
                                <Button
                                    id="cta-consumer-catalog"
                                    size="md"
                                    className="rounded-lg font-bold px-6 bg-white text-[#1e3a2d] hover:bg-white/90 transition-colors shadow-none"
                                >
                                    {t("shopNow")}
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                            </Link>
                            <Link href="/contact">
                                <Button
                                    id="cta-consumer-shop"
                                    size="md"
                                    variant="outline"
                                    className="rounded-lg font-semibold px-6 border-white/30 text-white hover:bg-white/10 transition-colors shadow-none"
                                >
                                    {isEn ? "Contact Us" : "Hubungi Kami"}
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* RIGHT - Partner / Agent CTA */}
                    <div className="flex flex-col justify-between gap-6 lg:pl-2">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/75">
                                    <Users className="w-4 h-4 text-accent-gold" />
                                    {isEn ? "Official HNI Partner" : "Kemitraan Resmi HNI"}
                                </span>
                                <span className="text-[11px] font-bold tracking-wider uppercase bg-white/10 text-white px-2.5 py-1 rounded-md border border-white/15">
                                    {isEn ? "Agent Price & TP" : "Harga Agen & Poin TP"}
                                </span>
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                                {t("ctaPartnerTitle")}
                            </h3>
                            <p className="text-sm text-white/80 leading-relaxed max-w-md">
                                {t("ctaPartnerDesc")}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link href="/register">
                                <Button
                                    id="cta-partner-register"
                                    size="md"
                                    className="rounded-lg font-bold px-6 bg-primary-sage hover:bg-primary-sage/90 text-white transition-colors shadow-none"
                                >
                                    {t("ctaPartnerBtnRegister")}
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                            </Link>
                            <Link href="/login">
                                <Button
                                    id="cta-partner-login"
                                    size="md"
                                    variant="outline"
                                    className="rounded-lg font-semibold px-6 border-white/30 text-white hover:bg-white/10 transition-colors shadow-none"
                                >
                                    {t("ctaPartnerBtnLogin")}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
