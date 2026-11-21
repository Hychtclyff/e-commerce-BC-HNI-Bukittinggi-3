export const featuredHniProducts = [
    {
        id: 1,
        name: "Minyak Herba Sinergi (MHS)",
        category: "Perawatan & Pertolongan Pertama",
        hkPrice: "Rp 45.000",
        haPrice: "Rp 30.000",
        points: "10 TP",
        rating: "4.9",
        sold: "2.4k+",
        image: "MHS",
        badge: "Terlaris",
    },
    {
        id: 2,
        name: "Madu Multiflora 250g",
        category: "Nutrisi & Daya Tahan Tubuh",
        hkPrice: "Rp 100.000",
        haPrice: "Rp 80.000",
        points: "25 TP",
        rating: "4.9",
        sold: "1.1k+",
        image: "MADU",
        badge: null,
    },
    {
        id: 3,
        name: "Kopi 7 Elemen (Sevel)",
        category: "Minuman Herba Sehat",
        hkPrice: "Rp 110.000",
        haPrice: "Rp 90.000",
        points: "25 TP",
        rating: "5.0",
        sold: "3.8k+",
        image: "KOPI",
        badge: "Pilihan Utama",
    },
    {
        id: 4,
        name: "Extra Food (Hania Fruit & Veg)",
        category: "Nutrisi Alami 21 Buah & Sayur",
        hkPrice: "Rp 80.000",
        haPrice: "Rp 60.000",
        points: "20 TP",
        rating: "4.8",
        sold: "950+",
        image: "EXTRA",
        badge: "Baru",
    },
];

export const FEATURES = [
    {
        titleKey: "feat1Title",
        descKey: "feat1Desc",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
            </svg>
        ),
        color: "from-emerald-500/20 to-teal-500/10",
        accent: "text-emerald-600 dark:text-emerald-400",
        border: "hover:border-emerald-300/60 dark:hover:border-emerald-600/40",
    },
    {
        titleKey: "feat2Title",
        descKey: "feat2Desc",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
            </svg>
        ),
        color: "from-accent-gold/20 to-yellow-500/10",
        accent: "text-accent-gold",
        border: "hover:border-accent-gold/40",
    },
    {
        titleKey: "feat3Title",
        descKey: "feat3Desc",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
            </svg>
        ),
        color: "from-blue-500/20 to-indigo-500/10",
        accent: "text-blue-600 dark:text-blue-400",
        border: "hover:border-blue-300/60 dark:hover:border-blue-600/40",
    },
    {
        titleKey: "feat4Title",
        descKey: "feat4Desc",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
        ),
        color: "from-orange-500/20 to-amber-500/10",
        accent: "text-orange-600 dark:text-orange-400",
        border: "hover:border-orange-300/60 dark:hover:border-orange-600/40",
    },
    {
        titleKey: "feat5Title",
        descKey: "feat5Desc",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
            </svg>
        ),
        color: "from-purple-500/20 to-violet-500/10",
        accent: "text-purple-600 dark:text-purple-400",
        border: "hover:border-purple-300/60 dark:hover:border-purple-600/40",
    },
    {
        titleKey: "feat6Title",
        descKey: "feat6Desc",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
            </svg>
        ),
        color: "from-rose-500/20 to-pink-500/10",
        accent: "text-rose-600 dark:text-rose-400",
        border: "hover:border-rose-300/60 dark:hover:border-rose-600/40",
    },
];