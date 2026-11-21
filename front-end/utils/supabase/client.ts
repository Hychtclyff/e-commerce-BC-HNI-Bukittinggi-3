import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// ANON_KEY (standar) atau PUBLISHABLE_KEY (alias HeroUI) — keduanya identik
const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const createClient = () =>
    createBrowserClient(supabaseUrl, supabaseAnonKey);