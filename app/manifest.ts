import type { MetadataRoute } from "next";

import { SITE_CONFIG } from "@/lib/marketing/data";

export default function manifest(): MetadataRoute.Manifest {
    return {
        background_color: SITE_CONFIG.backgroundColor,
        categories: ["education", "productivity", "networking"],
        description: SITE_CONFIG.description,
        display: "standalone",
        icons: [
            {
                sizes: "any",
                src: "/favicon.ico",
                type: "image/x-icon",
            },
        ],
        lang: SITE_CONFIG.defaultLocale,
        name: SITE_CONFIG.name,
        short_name: SITE_CONFIG.shortName,
        start_url: "/",
        theme_color: SITE_CONFIG.themeColor,
    };
}
