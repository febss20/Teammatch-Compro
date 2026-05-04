import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "TeamMatch - Cari Teman Lomba Kampus",
    description: "Platform kolaborasi mahasiswa untuk memenangkan kompetisi.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="id">
            <body className={`${inter.className} bg-white text-gray-900`}>{children}</body>
        </html>
    );
}
