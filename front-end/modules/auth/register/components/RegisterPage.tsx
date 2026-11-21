import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { Suspense } from "react";
import { GoogleAuthButton, AuthAlert, AuthCardWrapper } from "@/modules/auth/components/common";
import { RegisterForm } from "./RegisterForm";
import { ScrollShadow } from "@heroui/react";

export async function RegisterPage() {
    const t = await getTranslations("Auth");

    return (
        <ScrollShadow className="max-h-[calc(100vh-5rem)] rounded-3xl">
            <AuthCardWrapper>
                {/* Header */}
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-sage/10 border border-primary-sage/20 text-3xl mb-3 shadow-inner hover:scale-110 active:scale-95 transition-transform duration-300 cursor-pointer">
                        🤝
                    </div>
                    <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">
                        {t("registerTitle")}
                    </h2>
                    <p className="text-xs sm:text-sm text-text-muted mt-1.5 leading-relaxed">
                        {t("registerSubtitle")}
                    </p>
                </div>

                {/* Error / Success Alert */}
                <Suspense fallback={null}>
                    <AuthAlert />
                </Suspense>

                {/* Google OAuth Button */}
                <GoogleAuthButton mode="register" label={t("googleRegisterBtn")} />

                {/* Divider */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-border-subtle" />
                    <span className="text-xs text-text-muted px-1">{t("orDivider")}</span>
                    <div className="flex-1 h-px bg-border-subtle" />
                </div>

                {/* Email/Password Form */}
                <RegisterForm
                    nameLabel={t("nameLabel")}
                    namePlaceholder={t("namePlaceholder")}
                    emailLabel={t("emailLabel")}
                    emailPlaceholder={t("emailPlaceholder")}
                    phoneLabel={t("phoneLabel")}
                    phonePlaceholder={t("phonePlaceholder")}
                    passwordLabel={t("passwordLabel")}
                    passwordPlaceholder={t("passwordPlaceholder")}
                    registerBtnLabel={t("registerBtn")}
                    optionalLabel={t("optional")}
                    hniIdLaterInfo={t("hniIdLaterInfo")}
                />

                {/* Login link */}
                <p className="text-center text-xs sm:text-sm text-text-muted">
                    {t("loginLink")}{" "}
                    <Link
                        href="/login"
                        className="font-semibold text-primary-sage hover:text-primary-dark hover:underline transition-colors"
                    >
                        {t("signInText")}
                    </Link>
                </p>

                <div className="text-center">
                    <Link href="/" className="text-xs text-text-muted hover:text-text-primary transition-colors">
                        {t("backToHome")}
                    </Link>
                </div>
            </AuthCardWrapper>
        </ScrollShadow>
    );
}

export const Register = RegisterPage;
export default RegisterPage;
