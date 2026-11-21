import { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Login } from "@/modules/auth";

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getLocale();
    const isID = locale === "id";
    return {
        title: isID ? "Masuk Akun | TIJARAH-3" : "Sign In | TIJARAH-3",
        description: isID
            ? "Masuk ke akun mitra TIJARAH-3 Anda untuk mengakses portal B2B, laporan poin, dan manajemen pesanan."
            : "Sign in to your TIJARAH-3 partner account to access the B2B portal, point reports, and order management.",
        robots: { index: false, follow: false },
    };
}

export default async function LoginPage() {
    return (
        <Login />
    );
}
