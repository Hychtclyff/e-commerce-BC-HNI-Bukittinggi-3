// app/[lang]/(main)/layout.tsx
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PromoBanner } from "@/modules/Beranda/landing/components/molecules/PromoBanner";

export default async function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative flex flex-col min-h-screen overflow-x-hidden">
            {/* Promo Banner — dismissible */}
            <PromoBanner />
            <Navbar />
            <main className="container mx-auto max-w-7xl pt-6 px-4 sm:px-6 flex-grow">
                {children}
            </main>
            <Footer />
        </div>
    );
}