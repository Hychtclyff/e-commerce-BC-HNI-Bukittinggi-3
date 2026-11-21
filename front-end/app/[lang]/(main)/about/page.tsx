import { Card, Chip, Button } from "@heroui/react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { title, subtitle } from "@/components/primitives";
import About from "@/modules/Beranda/about";

export default async function AboutPage() {
  return (
    <About />
  );
}