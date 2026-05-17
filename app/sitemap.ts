import type { MetadataRoute } from "next";

import { COMPETITIONS, PUBLIC_MARKETING_ROUTES, SITE_CONFIG } from "@/lib/marketing/data";

function toAbsoluteUrl(pathname: string): string {
    return new URL(pathname, SITE_CONFIG.siteUrl).toString();
}

export default function sitemap(): MetadataRoute.Sitemap {
    const lastModified = new Date();

    const publicPages: MetadataRoute.Sitemap = PUBLIC_MARKETING_ROUTES.map((pathname) => ({
        changeFrequency: pathname === "/" ? "weekly" : "monthly",
        lastModified,
        priority: pathname === "/" ? 1 : 0.7,
        url: toAbsoluteUrl(pathname),
    }));

    const servicePages: MetadataRoute.Sitemap = COMPETITIONS.map((competition) => ({
        changeFrequency: "monthly",
        lastModified,
        priority: 0.8,
        url: toAbsoluteUrl(`/services/${competition.id}`),
    }));

    return [...publicPages, ...servicePages];
}
