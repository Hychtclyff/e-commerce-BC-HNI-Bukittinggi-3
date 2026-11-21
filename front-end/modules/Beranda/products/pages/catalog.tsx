import { Metadata } from "next";
import { Card, Chip, Button } from "@heroui/react";
import { getTranslations, getLocale } from "next-intl/server";
import { title, subtitle } from "@/components/primitives";
import { catalogProducts } from "../data";
import { Header } from "../organisms/headerSection";
import { Filter } from "../organisms/filterSection";
import { Catalog } from "../organisms/catalogSection";
import { Medical } from "../organisms/medicalSection";


export default async function Products() {
    const t = await getTranslations("Products");

    return (
        <div className="flex flex-col gap-10 py-8 md:py-12">
            {/* 1. Header Section */}
            <Header />

            {/* 2. Filter Tabs */}
            <Filter />

            {/* 3. Product Catalog Grid */}
            <Catalog />

            {/* 4. Medical Disclaimer */}
            <Medical />

        </div>
    );
}