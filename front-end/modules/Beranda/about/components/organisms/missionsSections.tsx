import { Card } from "@heroui/react";
import { getTranslations } from "next-intl/server";
import { Zap, Truck, Users } from "lucide-react";

export const Missions = async () => {
    const t = await getTranslations("About");

    return (
        <section className="flex flex-col gap-6 mt-4">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary text-center">
                {t("missionTitle")}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 border border-border-subtle bg-surface shadow-none rounded-2xl flex flex-col gap-3">
                    <div className="w-12 h-12 rounded-xl bg-canvas flex items-center justify-center text-primary-sage border border-border-subtle">
                        <Zap className="w-6 h-6 stroke-[1.8]" />
                    </div>
                    <h3 className="font-bold text-text-primary text-base">
                        {t("mission1Title")}
                    </h3>
                    <p className="text-sm text-text-muted leading-relaxed">
                        {t("mission1Desc")}
                    </p>
                </Card>

                <Card className="p-6 border border-border-subtle bg-surface shadow-none rounded-2xl flex flex-col gap-3">
                    <div className="w-12 h-12 rounded-xl bg-canvas flex items-center justify-center text-primary-sage border border-border-subtle">
                        <Truck className="w-6 h-6 stroke-[1.8]" />
                    </div>
                    <h3 className="font-bold text-text-primary text-base">
                        {t("mission2Title")}
                    </h3>
                    <p className="text-sm text-text-muted leading-relaxed">
                        {t("mission2Desc")}
                    </p>
                </Card>

                <Card className="p-6 border border-border-subtle bg-surface shadow-none rounded-2xl flex flex-col gap-3">
                    <div className="w-12 h-12 rounded-xl bg-canvas flex items-center justify-center text-primary-sage border border-border-subtle">
                        <Users className="w-6 h-6 stroke-[1.8]" />
                    </div>
                    <h3 className="font-bold text-text-primary text-base">
                        {t("mission3Title")}
                    </h3>
                    <p className="text-sm text-text-muted leading-relaxed">
                        {t("mission3Desc")}
                    </p>
                </Card>
            </div>
        </section>
    )
}