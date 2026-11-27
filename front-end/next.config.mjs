import createNextIntlPlugin from "next-intl/plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {
    "images": {
        "unoptimized": true,
        "remotePatterns": [
            {
                "protocol": "https",
                "hostname": "images.unsplash.com"
            },
            {
                "protocol": "https",
                "hostname": "**.supabase.co"
            },
            {
                "protocol": "https",
                "hostname": "kwzykmicocceovxxezsx.supabase.co"
            },
            {
                "protocol": "https",
                "hostname": "api.qrserver.com"
            },
            {
                "protocol": "https",
                "hostname": "e-commerce-bc-hni-bukittinggi-3.onrender.com"
            },
            {
                "protocol": "http",
                "hostname": "127.0.0.1"
            },
            {
                "protocol": "http",
                "hostname": "localhost"
            }
        ]
    }
};

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");
export default withNextIntl(nextConfig);
