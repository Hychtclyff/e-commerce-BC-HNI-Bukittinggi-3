export interface NewsProductItem {
    id: string;
    titleKey: string;
    descriptionKey: string;
    image: string;
    badgeKey: string;
    badgeVariant: "primary" | "secondary" | "success" | "warning" | "danger";
    price?: string;
    promoCode?: string;
    link?: string;
}

export const newsProductsData: NewsProductItem[] = [
    {
        id: "prod-1",
        titleKey: "product1Title",
        descriptionKey: "product1Desc",
        image: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600&auto=format&fit=crop",
        badgeKey: "newProductBadge",
        badgeVariant: "success",
        price: "Rp 120.000",
        promoCode: "TIJARAHNEW",
    },
    {
        id: "prod-2",
        titleKey: "product2Title",
        descriptionKey: "product2Desc",
        image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=600&auto=format&fit=crop",
        badgeKey: "promoBadge",
        badgeVariant: "warning",
        price: "Rp 85.000",
        promoCode: "HERBALPROMO",
    },
    {
        id: "prod-3",
        titleKey: "product3Title",
        descriptionKey: "product3Desc",
        image: "https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?q=80&w=600&auto=format&fit=crop",
        badgeKey: "bestsellerBadge",
        badgeVariant: "primary",
        price: "Rp 150.000",
        promoCode: "HNIEXCLUSIVE",
    },
];
