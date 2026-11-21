"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import { HniProfileData, B2BCreditProfileData } from "../../types/profile.types";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { motion } from "framer-motion";
import { Star, CreditCard, Package, Ticket } from "lucide-react";

interface ProfileStatsCardsProps {
  hniProfile?: HniProfileData | null;
  creditAccount?: B2BCreditProfileData | null;
  activeOrdersCount?: number;
  activeVouchersCount?: number;
}

export function ProfileStatsCards({
  hniProfile,
  creditAccount,
  activeOrdersCount = 2,
  activeVouchersCount = 3,
}: ProfileStatsCardsProps) {
  const t = useTranslations();
  const locale = useLocale();
  const numLocale = locale === "en" ? "en-US" : "id-ID";
  const points = hniProfile?.totalPointsTP || 0;
  const availableCredit = creditAccount?.currentBalance ?? 0;
  const creditLimit = creditAccount?.creditLimit ?? 0;

  const stats = [
    {
      id: "points",
      title: t("statsTotalPoints"),
      value: `${points.toLocaleString(numLocale)} TP`,
      subtitle: t("statsPointsSub"),
      icon: <Star className="w-6 h-6 text-accent-gold" />,
      color: "border-accent-gold/40 text-accent-gold bg-accent-gold/5",
    },
    {
      id: "credit",
      title: t("statsRemainingCredit"),
      value: `Rp ${availableCredit.toLocaleString(numLocale)}`,
      subtitle: `${t("totalCreditLimit")}: Rp ${creditLimit.toLocaleString(numLocale)}`,
      icon: <CreditCard className="w-6 h-6 text-primary-sage" />,
      color: "border-primary-sage/40 text-primary-sage bg-primary-sage/5",
    },
    {
      id: "orders",
      title: t("statsActiveOrders"),
      value: `${activeOrdersCount}`,
      subtitle: t("statsOrdersSub"),
      icon: <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      color: "border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-500/5",
    },
    {
      id: "vouchers",
      title: t("statsActiveVouchers"),
      value: `${activeVouchersCount}`,
      subtitle: t("statsVouchersSub"),
      icon: <Ticket className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
      color: "border-purple-500/40 text-purple-600 dark:text-purple-400 bg-purple-500/5",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((item, idx) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.08 }}
        >
          <TijarahCard
            tijarahVariant="default"
            className={`p-5 border ${item.color} shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-xs font-semibold text-text-muted">{item.title}</span>
              {item.icon}
            </div>
            <div className="text-xl font-extrabold text-text-primary tracking-tight">
              {item.value}
            </div>
            <div className="text-[11px] text-text-muted mt-1 font-medium">
              {item.subtitle}
            </div>
          </TijarahCard>
        </motion.div>
      ))}
    </div>
  );
}
