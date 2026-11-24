import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { Logo, GithubIcon, TwitterIcon, DiscordIcon } from "@/components/icons";
import { siteConfig } from "@/config/site";

export const Footer = () => {
    const t = useTranslations("Footer");
    const tNav = useTranslations("Navigation");

    return (
        <footer className="w-full border-t border-border-subtle bg-surface text-text-primary transition-colors mt-auto">
            <div className="mx-auto max-w-[1280px] px-6 py-12 lg:py-16">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
                    {/* Kolom 1: Profil Brand & Kontak (2 Kolom Lebar di Layar Besar) */}
                    <div className="lg:col-span-2 flex flex-col gap-4">
                        <Link className="flex items-center gap-2 group w-fit" href="/">
                            <Logo className="text-primary-sage group-hover:text-primary-dark transition-colors" />
                            <span className="text-xl font-bold tracking-tight text-text-primary">
                                {siteConfig.name}
                            </span>
                        </Link>
                        <p className="text-sm text-text-muted max-w-sm leading-relaxed">
                            {t("aboutText")}
                        </p>
                        <div className="text-xs text-text-muted flex flex-col gap-1 mt-1">
                            <p className="font-semibold text-text-primary">{t("addressTitle")}:</p>
                            <p>{t("address")}</p>
                            <p className="mt-1">{t("contact")}</p>
                        </div>
                    </div>

                    {/* Kolom 2: Tautan Menu Cepat */}
                    <div className="flex flex-col gap-3">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-text-primary">
                            {t("quickLinksTitle")}
                        </h4>
                        <ul className="flex flex-col gap-2">
                            {siteConfig.navItems.map((item) => (
                                <li key={item.key}>
                                    <Link
                                        href={item.href}
                                        className="text-sm text-text-muted hover:text-primary-sage transition-colors"
                                    >
                                        {tNav(item.key)}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Kolom 3: Bantuan & Syarat */}
                    <div className="flex flex-col gap-3">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-text-primary">
                            {t("helpTitle")}
                        </h4>
                        <ul className="flex flex-col gap-2 text-sm text-text-muted">
                            <li>
                                <Link href="/faq" className="hover:text-primary-sage transition-colors">
                                    {t("faq")}
                                </Link>
                            </li>
                            <li>
                                <Link href="/shipping" className="hover:text-primary-sage transition-colors">
                                    {t("shippingInfo")}
                                </Link>
                            </li>
                            <li>
                                <Link href="/returns" className="hover:text-primary-sage transition-colors">
                                    {t("returns")}
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy" className="hover:text-primary-sage transition-colors">
                                    {t("privacy")}
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="hover:text-primary-sage transition-colors">
                                    Syarat & Ketentuan
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Kolom 4: Pembayaran, Ekspedisi & Sosial Media */}
                    <div className="flex flex-col gap-4">
                        <div>
                            <h4 className="text-sm font-semibold uppercase tracking-wider text-text-primary mb-3">
                                {t("paymentTitle")}
                            </h4>
                            <div className="flex flex-wrap gap-2 text-xs font-semibold">
                                <span className="px-2.5 py-1 rounded bg-canvas border border-border-subtle text-text-primary">QRIS</span>
                                <span className="px-2.5 py-1 rounded bg-canvas border border-border-subtle text-text-primary">BSI</span>
                                <span className="px-2.5 py-1 rounded bg-canvas border border-border-subtle text-text-primary">Mandiri</span>
                                <span className="px-2.5 py-1 rounded bg-canvas border border-border-subtle text-text-primary">J&T / JNE</span>
                                <span className="px-2.5 py-1 rounded bg-canvas border border-border-subtle text-text-primary">Ekspedisi Regional</span>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs text-text-muted mb-2 font-medium">Ikuti Kami:</p>
                            <div className="flex items-center gap-3">
                                <a
                                    href={siteConfig.links.github}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-canvas transition-colors"
                                    aria-label="GitHub"
                                >
                                    <GithubIcon size={18} />
                                </a>
                                <a
                                    href={siteConfig.links.twitter}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-canvas transition-colors"
                                    aria-label="Twitter"
                                >
                                    <TwitterIcon size={18} />
                                </a>
                                <a
                                    href={siteConfig.links.discord}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-canvas transition-colors"
                                    aria-label="Discord"
                                >
                                    <DiscordIcon size={18} />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Garis Pembatas Bawah */}
                <div className="mt-12 pt-6 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
                    <p>
                        © {new Date().getFullYear()} {siteConfig.name}. {t("allRightsReserved")}
                    </p>

                    <p className="flex items-center gap-1.5">
                        <span>Designed & Developed with ❤️ by</span>
                        <a
                            href="https://github.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-primary-sage hover:text-primary-dark transition-colors hover:underline"
                        >
                            QulsDev
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    );
};  