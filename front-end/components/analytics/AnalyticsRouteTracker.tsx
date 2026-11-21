"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackGAEvent, trackMetaPixelEvent } from "@/lib/analytics";

export const AnalyticsRouteTracker = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        const url = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

        // Update GA4 PageView
        trackGAEvent("page_view", {
            page_location: window.location.href,
            page_path: url,
            page_title: document.title,
        });

        // Update Meta Pixel PageView
        trackMetaPixelEvent("PageView");
    }, [pathname, searchParams]);

    return null;
};