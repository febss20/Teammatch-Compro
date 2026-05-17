export interface MarketingCompetition {
    id: string;
    title: string;
    description: string;
    image: string;
}

export interface SiteConfig {
    backgroundColor: string;
    defaultLocale: string;
    description: string;
    keywords: string[];
    locale: string;
    name: string;
    shortName: string;
    siteUrl: string;
    themeColor: string;
}

function normalizeSiteUrl(rawSiteUrl: string | undefined): string {
    if (!rawSiteUrl) {
        return "http://localhost:3000";
    }

    try {
        return new URL(rawSiteUrl).origin;
    } catch {
        return "http://localhost:3000";
    }
}

export const SITE_CONFIG: SiteConfig = {
    backgroundColor: "#f4efe4",
    defaultLocale: "id-ID",
    description:
        "Platform kolaborasi mahasiswa untuk mencari teman lomba kampus, menyusun board ide, dan membangun tim yang solid.",
    keywords: ["teammatch", "teman lomba kampus", "tim lomba mahasiswa", "hackathon kampus", "board ide kompetisi"],
    locale: "id_ID",
    name: "TeamMatch",
    shortName: "TeamMatch",
    siteUrl: normalizeSiteUrl(process.env.NEXT_PUBLIC_BASE_URL),
    themeColor: "#ff6b2c",
};

export const PUBLIC_MARKETING_ROUTES = ["/", "/about", "/services", "/gallery", "/contact"] as const;

export const COMPETITIONS: readonly MarketingCompetition[] = [
    {
        id: "tech",
        title: "Teknologi & IT",
        description: "Hackathon, UI/UX Design, dan Competitive Programming.",
        image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=800",
    },
    {
        id: "business",
        title: "Bisnis & Startup",
        description: "Business Plan, Pitching, dan Marketing Competition.",
        image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800",
    },
    {
        id: "art",
        title: "Seni & Desain",
        description: "Poster Design, Videografi, dan Fotografi.",
        image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=800",
    },
] as const;
