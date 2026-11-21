export interface CatalogProductItem {
    id: string;
    name: string;
    category: string;
    categoryKey: string;
    hkPrice: string;
    haPrice: string;
    points: string;
    rating: string;
    sold: string;
    image: string;
    badge?: string | null;
}

export const catalogProducts: CatalogProductItem[] = [
    {
        id: "p_01",
        name: "Minyak Herba Sinergi (MHS 100ml)",
        category: "Perawatan & Herba",
        categoryKey: "filterCare",
        hkPrice: "Rp 45.000",
        haPrice: "Rp 30.000",
        points: "10 TP",
        rating: "4.9",
        sold: "2.4k+",
        image: "MHS",
        badge: "Terlaris",
    },
    {
        id: "p_02",
        name: "Madu Multiflora HNI 250g",
        category: "Nutrisi & Madu",
        categoryKey: "filterNutrition",
        hkPrice: "Rp 100.000",
        haPrice: "Rp 80.000",
        points: "25 TP",
        rating: "4.9",
        sold: "1.1k+",
        image: "MADU",
        badge: null,
    },
    {
        id: "p_03",
        name: "Kopi 7 Elemen (Sevel Coffee)",
        category: "Minuman Sehat",
        categoryKey: "filterBeverage",
        hkPrice: "Rp 110.000",
        haPrice: "Rp 90.000",
        points: "25 TP",
        rating: "5.0",
        sold: "3.8k+",
        image: "KOPI",
        badge: "Pilihan Utama",
    },
    {
        id: "p_04",
        name: "Extra Food Hania (Fruit & Veg)",
        category: "Nutrisi & Suplemen",
        categoryKey: "filterNutrition",
        hkPrice: "Rp 80.000",
        haPrice: "Rp 60.000",
        points: "20 TP",
        rating: "4.8",
        sold: "950+",
        image: "EXTRA",
        badge: "Favorit",
    },
    {
        id: "p_05",
        name: "Spirulina Kapsul Alami 60 Kapsul",
        category: "Kesehatan Tubuh",
        categoryKey: "filterHealth",
        hkPrice: "Rp 90.000",
        haPrice: "Rp 70.000",
        points: "20 TP",
        rating: "4.9",
        sold: "1.5k+",
        image: "SPIRU",
        badge: null,
    },
    {
        id: "p_06",
        name: "Pasta Gigi Herbal (PGH) Siwak & Sirih",
        category: "Perawatan & Kebersihan",
        categoryKey: "filterCare",
        hkPrice: "Rp 20.000",
        haPrice: "Rp 16.000",
        points: "5 TP",
        rating: "4.8",
        sold: "4.2k+",
        image: "PGH",
        badge: null,
    },
];