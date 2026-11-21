import { getTranslations } from "next-intl/server";

export const Medical = async () => {
    const t = await getTranslations("Products");

    return (
        <p className="text-center text-xs text-text-muted italic">
            {t("disclaimer")}
        </p>
    )
}