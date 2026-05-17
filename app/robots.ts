import type { MetadataRoute } from "next";

import { SITE_CONFIG } from "@/lib/marketing/data";

export default function robots(): MetadataRoute.Robots {
    return {
        host: SITE_CONFIG.siteUrl,
        rules: [
            {
                allow: "/",
                disallow: ["/api/", "/dashboard/", "/login", "/register"],
                userAgent: "*",
            },
        ],
        sitemap: `${SITE_CONFIG.siteUrl}/sitemap.xml`,
    };
}
