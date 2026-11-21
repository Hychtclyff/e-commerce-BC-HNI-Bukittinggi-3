import { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Register } from "@/modules/auth";

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getLocale();
    const isID = locale === "id";
    return {
        title: isID ? "Daftar Akun | TIJARAH-3" : "Create Account | TIJARAH-3",
        description: isID
            ? "Buat akun TIJARAH-3. ID Agen HNI bisa dilengkapi nanti di profil Anda."
            : "Create your TIJARAH-3 account. Your HNI Agent ID can be added later in your profile.",
        robots: { index: false, follow: false },
    };
}

export default async function RegisterPage() {
    return (
        <Register />
    );
}
