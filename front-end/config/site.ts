  // config/site.ts
  export type SiteConfig = typeof siteConfig;

  export const siteConfig = {
    name: "Tijarah",
    links: {
      github: "https://github.com/heroui-inc/heroui",
      twitter: "https://twitter.com/hero_ui",
      docs: "https://heroui.com",
      discord: "https://discord.gg/9b6yyZKmH4",
      sponsor: "https://patreon.com/jrgarciadev",
    },
    navItems: [
      { key: "home", href: "/" },
      { key: "about", href: "/about" },
      { key: "news", href: "/news" },
      { key: "shop", href: "/shop" },
      { key: "cart", href: "/cart" },
      { key: "checkout", href: "/checkout" },
      { key: "contact", href: "/contact" },
    ],
    navMenuItems: [
      { key: "home", href: "/" },
      { key: "about", href: "/about" },
      { key: "news", href: "/news" },
      { key: "shop", href: "/shop" },
      { key: "cart", href: "/cart" },
      { key: "checkout", href: "/checkout" },
      { key: "contact", href: "/contact" },
    ],
  };