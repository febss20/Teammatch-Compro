import type { Metadata } from "next";
import localFont from "next/font/local";

import { SITE_CONFIG } from "@/lib/marketing/data";

import "./globals.css";

const bebasNeue = localFont({
    display: "swap",
    src: "./fonts/Bebas_Neue/BebasNeue-Regular.ttf",
    variable: "--font-display",
});

export const metadata: Metadata = {
    applicationName: SITE_CONFIG.name,
    authors: [{ name: SITE_CONFIG.name }],
    description: SITE_CONFIG.description,
    icons: {
        apple: [{ url: "/favicon.ico" }],
        icon: [{ url: "/favicon.ico" }],
        shortcut: [{ url: "/favicon.ico" }],
    },
    keywords: SITE_CONFIG.keywords,
    manifest: "/manifest.webmanifest",
    metadataBase: new URL(SITE_CONFIG.siteUrl),
    openGraph: {
        description: SITE_CONFIG.description,
        locale: SITE_CONFIG.locale,
        siteName: SITE_CONFIG.name,
        title: "TeamMatch - Cari Teman Lomba Kampus",
        type: "website",
        url: SITE_CONFIG.siteUrl,
    },
    referrer: "strict-origin-when-cross-origin",
    title: "TeamMatch - Cari Teman Lomba Kampus",
    twitter: {
        card: "summary_large_image",
        description: SITE_CONFIG.description,
        title: "TeamMatch - Cari Teman Lomba Kampus",
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html className={bebasNeue.variable} lang="id">
            <body className="body-font site-shell text-[var(--tm-ink)] antialiased">{children}</body>
        </html>
    );
}
