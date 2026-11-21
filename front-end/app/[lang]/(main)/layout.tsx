// app/[lang]/(main)/layout.tsx
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PromoBanner } from "@/modules/Beranda/landing/components/molecules/PromoBanner";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export default async function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Cek status verifikasi email user yang sedang login
    // Di development: skip pengecekan agar tidak mengganggu workflow dev
    const isDev = process.env.NODE_ENV === "development";

    let isEmailUnverified = false;
    let userEmail = "";

    if (!isDev) {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);
        const { data: { user } } = await supabase.auth.getUser();

        isEmailUnverified =
            user !== null &&
            user.app_metadata?.provider === "email" &&
            !user.email_confirmed_at;

        userEmail = user?.email ?? "";
    }

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