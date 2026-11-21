"use client";

import { useState, useRef, useEffect } from "react";
import { Kbd, TextField, InputGroup } from "@heroui/react";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/lib/i18n/navigation";
import { User, Store, LogOut, ArrowRight, ShoppingBag, Sparkles } from "lucide-react";
import { initialShopProducts } from "@/modules/shop/api/shop.api";
import { formatCurrency } from "@/utils/formatters";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { SearchIcon, Logo } from "@/components/icons";
import { LanguageSwitch } from "./language-switch";
import { useAuthStore } from "@/modules/auth/services/auth.store";
import { authService } from "@/modules/auth/services/auth.service";
import { useCart } from "@/modules/shop/hooks/useCart";
import { CartDrawerSheet } from "@/modules/shop/components/organisms/CartDrawerSheet";
import { NotificationBell } from "@/components/molecules/NotificationBell";

// -- Icon komponen inline --
const ShopBagIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
    </svg>
);

const CartIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
    </svg>
);

// Nav items yang ditampilkan sebagai TEKS
const TEXT_NAV_KEYS = ["home", "about", "news", "contact"];

// Nav items yang ditampilkan sebagai ICON di kanan
const ICON_NAV_ITEMS = [
    {
        key: "shop",
        href: "/shop",
        icon: ShopBagIcon,
        label: "Shop",
    },
    {
        key: "cart",
        href: "/cart",
        icon: CartIcon,
        label: "Keranjang",
        badge: 0, // ganti dengan state/context cart count
    },
];

export const Navbar = () => {
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    const t = useTranslations("Navigation");
    const pathname = usePathname();
    const user = useAuthStore((state) => state.user);
    const isAgent = Boolean(user?.isAgent || user?.role === "AGENT" || user?.hniMemberId);
    const { totalCount, openCartSheet, isCartSheetOpen } = useCart();

    const textNavItems = siteConfig.navItems.filter((i) =>
        TEXT_NAV_KEYS.includes(i.key)
    );

    // Filter produk berdasarkan query
    const searchResults = searchQuery.trim()
        ? initialShopProducts.filter((p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5)
        : [];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                searchContainerRef.current &&
                !searchContainerRef.current.contains(event.target as Node)
            ) {
                setIsSearchOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelectProduct = (productId: string) => {
        setIsSearchOpen(false);
        setSearchQuery("");
        router.push(`/products/${productId}`);
    };

    const searchInput = (
        <div ref={searchContainerRef} className="relative w-full max-w-[200px] xl:max-w-[260px]">
            <TextField aria-label="Search" type="search" className="w-full">
                <InputGroup className="bg-canvas border border-border-subtle rounded-xl focus-within:border-primary-sage transition-colors h-9">
                    <InputGroup.Prefix className="pl-2.5">
                        <SearchIcon className="text-base text-text-muted pointer-events-none flex-shrink-0" />
                    </InputGroup.Prefix>
                    <InputGroup.Input
                        className="text-xs bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none py-1 px-1.5 w-full"
                        placeholder="Cari produk herba..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setIsSearchOpen(true);
                        }}
                        onFocus={() => {
                            if (searchQuery.trim()) setIsSearchOpen(true);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && searchResults.length > 0) {
                                handleSelectProduct(searchResults[0].id);
                            }
                        }}
                    />
                    <InputGroup.Suffix className="pr-2">
                        <Kbd className="hidden xl:inline-flex bg-surface border border-border-subtle text-text-muted shadow-none text-[10px] px-1.5 py-0.5">
                            <Kbd.Abbr keyValue="command" />
                            <Kbd.Content>K</Kbd.Content>
                        </Kbd>
                    </InputGroup.Suffix>
                </InputGroup>
            </TextField>

            {/* Dropdown Live Search */}
            {isSearchOpen && searchQuery.trim().length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface border border-border-subtle rounded-2xl shadow-none overflow-hidden z-50 p-1.5 flex flex-col gap-1 min-w-[280px]">
                    {searchResults.length > 0 ? (
                        <>
                            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted border-b border-border-subtle">
                                Produk ({searchResults.length})
                            </div>
                            {searchResults.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleSelectProduct(item.id)}
                                    className="w-full flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-canvas text-left transition-colors cursor-pointer group"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-canvas border border-border-subtle flex items-center justify-center shrink-0 text-text-muted group-hover:text-primary-sage">
                                            <ShoppingBag className="w-4 h-4 stroke-[1.5]" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-text-primary truncate group-hover:text-primary-sage transition-colors">
                                                {item.name}
                                            </p>
                                            <p className="text-[10px] text-text-muted truncate">
                                                {item.category}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs font-bold text-primary-sage">
                                            {formatCurrency(isAgent ? item.agentPrice : item.normalPrice)}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </>
                    ) : (
                        <div className="p-4 text-center text-xs text-text-muted">
                            Tidak ada produk dengan kata kunci &quot;{searchQuery}&quot;
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <nav className="sticky top-0 z-40 w-full border-b border-border-subtle bg-surface/90 backdrop-blur-md transition-colors">
            <header className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-2 md:gap-4 px-4 sm:px-6">

                {/* -- Kiri: Logo + Nav teks -- */}
                <div className="flex items-center gap-4 xl:gap-6 min-w-0">
                    <Link className="flex items-center gap-2 group shrink-0" href="/">
                        <Logo className="text-primary-sage group-hover:text-primary-dark transition-colors" />
                        <p className="font-bold text-text-primary tracking-tight text-base sm:text-lg whitespace-nowrap">
                            {siteConfig.name}
                        </p>
                    </Link>

                    {/* Nav teks - desktop */}
                    <ul className="hidden xl:flex items-center gap-0.5">
                        {textNavItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <li key={item.key} className="shrink-0">
                                    <Link
                                        className={clsx(
                                            "text-xs font-medium transition-colors py-1.5 px-2.5 rounded-lg whitespace-nowrap inline-block",
                                            isActive
                                                ? "text-primary-sage bg-primary-sage/10 font-semibold"
                                                : "text-text-muted hover:text-text-primary hover:bg-canvas"
                                        )}
                                        href={item.href}
                                    >
                                        {t(item.key)}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {/* -- Kanan: Desktop -- */}
                <div className="hidden sm:flex items-center gap-2 shrink-0">
                    {/* Search */}
                    <div className="hidden lg:block">{searchInput}</div>

                    {/* Icon nav - Shop Link & Cart Sheet Trigger */}
                    <div className="flex items-center gap-1">
                        <Link
                            href="/shop"
                            aria-label="Shop"
                            title="Katalog Produk"
                            className={clsx(
                                "relative flex items-center justify-center w-9 h-9 rounded-xl transition-colors",
                                pathname === "/shop" || pathname.startsWith("/shop/")
                                    ? "text-primary-sage bg-primary-sage/10 font-semibold"
                                    : "text-text-muted hover:text-text-primary hover:bg-canvas"
                            )}
                        >
                            <ShopBagIcon className="w-5 h-5" />
                        </Link>

                        {/* Cart Drawer Trigger Button */}
                        <button
                            id="navbar-cart-btn"
                            type="button"
                            onClick={openCartSheet}
                            aria-label={`Keranjang Belanja (${totalCount} item)`}
                            title="Buka Keranjang Belanja"
                            className={clsx(
                                "relative flex items-center justify-center w-9 h-9 rounded-xl transition-all cursor-pointer focus:outline-none",
                                isCartSheetOpen
                                    ? "text-primary-sage bg-primary-sage/15 ring-2 ring-primary-sage/30 shadow-xs"
                                    : "text-text-muted hover:text-text-primary hover:bg-canvas"
                            )}
                        >
                            <CartIcon className="w-5 h-5" />
                            {totalCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-accent-gold text-[9px] font-bold text-white shadow-sm ring-2 ring-surface animate-in zoom-in-75">
                                    {totalCount > 99 ? "99+" : totalCount}
                                </span>
                            )}
                        </button>

                        {/* Notification Bell */}
                        <NotificationBell />
                    </div>

                    {/* Divider */}
                    <div className="w-px h-5 bg-border-subtle mx-1" />

                    {/* Theme & Language */}
                    <ThemeSwitch />
                    <LanguageSwitch />

                    {/* Divider */}
                    <div className="w-px h-5 bg-border-subtle mx-1" />

                    {/* Auth / Profile Section */}
                    {user ? (
                        <div className="relative">
                            <button
                                id="navbar-profile-menu-btn"
                                type="button"
                                onClick={() => setIsProfileOpen((prev) => !prev)}
                                className="flex items-center gap-2 py-1 px-2.5 rounded-xl border border-border-subtle bg-canvas hover:bg-surface transition-all focus:outline-none"
                            >
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-sage/20 text-xs font-bold text-primary-sage shrink-0">
                                    {(user.fullName || user.email || "U").charAt(0).toUpperCase()}
                                </div>
                                <span className="max-w-[100px] truncate text-xs font-semibold text-text-primary">
                                    {user.fullName || user.email?.split("@")[0] || "Profile"}
                                </span>
                                <svg
                                    className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""
                                        }`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Floating Dropdown Card */}
                            {isProfileOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsProfileOpen(false)}
                                    />
                                    <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-2xl border border-border-subtle bg-surface shadow-xl p-2 text-xs transition-all animate-in fade-in-50 slide-in-from-top-2">
                                        <div className="px-3 py-2.5 rounded-xl bg-canvas mb-1 border border-border-subtle/50">
                                            <p className="font-bold text-text-primary text-xs truncate">
                                                {user.fullName || "Mitra TIJARAH"}
                                            </p>
                                            <p className="text-text-muted text-[11px] truncate">
                                                {user.email}
                                            </p>
                                            {user.userType && (
                                                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-accent-gold/15 text-accent-gold font-semibold text-[10px]">
                                                    {user.userType}
                                                </span>
                                            )}
                                        </div>

                                        <Link
                                            href="/profile"
                                            onClick={() => setIsProfileOpen(false)}
                                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-text-primary hover:bg-canvas transition-colors font-medium"
                                        >
                                            <User className="w-4 h-4 text-text-muted" /> {t("profile")}
                                        </Link>

                                        <Link
                                            href="/store"
                                            onClick={() => setIsProfileOpen(false)}
                                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-text-primary hover:bg-canvas transition-colors font-medium"
                                        >
                                            <Store className="w-4 h-4 text-text-muted" /> {t("store") || "Toko / Vendor Dashboard"}
                                        </Link>

                                        <div className="h-px bg-border-subtle my-1" />

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsProfileOpen(false);
                                                authService.logout();
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-status-danger hover:bg-status-danger/10 transition-colors font-semibold cursor-pointer"
                                        >
                                            <LogOut className="w-4 h-4 text-status-danger" /> {t("logout")}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link
                                id="navbar-login-btn"
                                href="/login"
                                className="text-xs font-semibold text-text-muted hover:text-text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-canvas whitespace-nowrap"
                            >
                                {t("login")}
                            </Link>
                            <Link
                                id="navbar-register-btn"
                                href="/register"
                                className="text-xs font-semibold bg-primary-sage hover:bg-primary-dark text-white px-3.5 py-1.5 rounded-full transition-all hover:scale-[1.03] active:scale-[0.97] shadow-sm whitespace-nowrap"
                            >
                                {t("register")}
                            </Link>
                        </div>
                    )}

                </div>

                {/* -- Kanan: Mobile toggle & toolbar -- */}
                <div className="flex sm:hidden items-center gap-1 shrink-0">
                    {/* Mobile Cart Trigger Button */}
                    <button
                        id="mobile-navbar-cart-btn"
                        type="button"
                        onClick={openCartSheet}
                        aria-label={`Keranjang Belanja (${totalCount} item)`}
                        className={clsx(
                            "relative p-2 rounded-xl transition-colors cursor-pointer focus:outline-none",
                            isCartSheetOpen
                                ? "text-primary-sage bg-primary-sage/15"
                                : "text-text-muted hover:text-text-primary hover:bg-canvas"
                        )}
                    >
                        <CartIcon className="h-5 w-5" />
                        {totalCount > 0 && (
                            <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-accent-gold text-[9px] font-bold text-white shadow-sm ring-1 ring-surface">
                                {totalCount > 99 ? "99+" : totalCount}
                            </span>
                        )}
                    </button>

                    <NotificationBell />
                    <ThemeSwitch />
                    <LanguageSwitch />
                    <button
                        aria-expanded={isMenuOpen}
                        aria-label="Toggle menu"
                        className="p-2 rounded-lg text-text-primary hover:bg-canvas transition-colors focus:outline-none"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {isMenuOpen ? (
                                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                            ) : (
                                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                            )}
                        </svg>
                    </button>
                </div>
            </header>

            {/* -- Mobile / Tablet dropdown -- */}
            {isMenuOpen && (
                <div className="border-t border-border-subtle sm:hidden bg-surface shadow-lg">
                    {/* Search mobile */}
                    <div className="p-4">{searchInput}</div>

                    {/* Nav links */}
                    <ul className="flex flex-col gap-0.5 px-3 pb-2">
                        {siteConfig.navMenuItems.map((item) => {
                            const isActive = pathname === item.href;

                            // Jika item adalah keranjang belanja, jadikan trigger pembuka Cart Sheet
                            if (item.key === "cart") {
                                return (
                                    <li key={item.key}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                openCartSheet();
                                            }}
                                            className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-sm transition-colors text-text-primary hover:bg-canvas text-left cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3">
                                                <CartIcon className="w-4 h-4 shrink-0 text-primary-sage" />
                                                <span>{t(item.key)}</span>
                                            </div>
                                            {totalCount > 0 && (
                                                <span className="px-2 py-0.5 rounded-full bg-accent-gold text-white font-bold text-xs shadow-xs">
                                                    {totalCount} item
                                                </span>
                                            )}
                                        </button>
                                    </li>
                                );
                            }

                            return (
                                <li key={item.key}>
                                    <Link
                                        className={clsx(
                                            "flex items-center gap-3 py-2.5 px-3 rounded-xl text-sm transition-colors",
                                            isActive
                                                ? "text-primary-sage bg-primary-sage/10 font-semibold"
                                                : "text-text-primary hover:bg-canvas"
                                        )}
                                        href={item.href}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        {item.key === "shop" && <ShopBagIcon className="w-4 h-4 shrink-0 text-primary-sage" />}
                                        {t(item.key)}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>

                    {/* Auth / Profile section mobile */}
                    {user ? (
                        <div className="flex flex-col gap-2 px-4 pb-4 pt-2 border-t border-border-subtle mt-1">
                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-canvas border border-border-subtle">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-sage/20 text-sm font-bold text-primary-sage">
                                    {(user.fullName || user.email || "U").charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-text-primary text-xs truncate">
                                        {user.fullName || "Mitra TIJARAH"}
                                    </p>
                                    <p className="text-text-muted text-[11px] truncate">
                                        {user.email}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Link
                                    href="/profile"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex-1 text-center text-xs font-semibold text-text-primary border border-border-subtle py-2.5 rounded-full hover:bg-canvas transition-colors"
                                >
                                    {t("profile")}
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        authService.logout();
                                    }}
                                    className="flex-1 text-center text-xs font-semibold bg-status-danger/10 hover:bg-status-danger/20 text-status-danger py-2.5 rounded-full transition-all"
                                >
                                    {t("logout")}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-2 px-4 pb-4 pt-2 border-t border-border-subtle mt-1">
                            <Link
                                id="mobile-navbar-login-btn"
                                href="/login"
                                onClick={() => setIsMenuOpen(false)}
                                className="flex-1 text-center text-sm font-semibold text-text-primary border border-border-subtle py-2.5 rounded-full hover:bg-canvas transition-colors"
                            >
                                {t("login")}
                            </Link>
                            <Link
                                id="mobile-navbar-register-btn"
                                href="/register"
                                onClick={() => setIsMenuOpen(false)}
                                className="flex-1 text-center text-sm font-semibold bg-primary-sage hover:bg-primary-dark text-white py-2.5 rounded-full transition-all shadow-sm"
                            >
                                {t("register")}
                            </Link>
                        </div>
                    )}
                </div>
            )}

            {/* -- Global Cart Drawer Sheet (TijarahSheet) -- */}
            <CartDrawerSheet />
        </nav>
    );
};