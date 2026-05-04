import type { Metadata } from "next";
import { Bebas_Neue, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const bebasNeue = Bebas_Neue({
    subsets: ["latin"],
    weight: "400",
    variable: "--font-display",
});

const ibmPlexSans = IBM_Plex_Sans({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-body",
});

export const metadata: Metadata = {
    title: "TeamMatch - Cari Teman Lomba Kampus",
    description: "Platform kolaborasi mahasiswa untuk memenangkan kompetisi.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="id" className={`${bebasNeue.variable} ${ibmPlexSans.variable}`}>
            <body className="body-font site-shell text-[var(--tm-ink)] antialiased">{children}</body>
        </html>
    );
}
