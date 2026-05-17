import Link from "next/link";

import { Logo } from "@/components/shared/Logo";

const NAV_LINKS = [
    { href: "/", label: "Beranda" },
    { href: "/about", label: "Tentang" },
    { href: "/login?next=/dashboard/boards", label: "Boards" },
    { href: "/services", label: "Kategori" },
    { href: "/gallery", label: "Galeri" },
    { href: "/contact", label: "Kontak" },
];

const ACTION_LINKS = [
    { href: "/login", label: "Masuk" },
    { href: "/register", label: "Daftar" },
];

export default function Navbar() {
    return (
        <nav className="sticky top-0 z-50 border-b-[3px] border-[var(--tm-line)] bg-[rgba(255,249,239,0.92)] backdrop-blur">
            <div className="page-frame py-4">
                <div className="brutal-panel flex items-center justify-between gap-4 bg-[rgba(255,249,239,0.94)] px-5 py-4 md:px-7">
                    <Link href="/">
                        <Logo />
                    </Link>

                    <div className="hidden items-center gap-3 lg:flex">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="display-font rounded-full border-[3px] border-transparent px-4 py-2 text-base uppercase tracking-[0.04em] hover:border-[var(--tm-line)] hover:bg-white"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    <div className="hidden items-center gap-3 md:flex">
                        <Link href="/login" className="brutal-button-secondary !px-5 !py-3 !text-[0.95rem]">
                            {ACTION_LINKS[0]?.label}
                        </Link>
                        <Link href="/register" className="brutal-button !px-5 !py-3 !text-[0.95rem]">
                            {ACTION_LINKS[1]?.label}
                        </Link>
                    </div>

                    <details className="relative lg:hidden">
                        <summary
                            className="inline-flex h-12 w-12 cursor-pointer list-none items-center justify-center rounded-full border-[3px] border-[var(--tm-line)] bg-[var(--tm-accent)] shadow-[4px_4px_0_var(--tm-line)] [&::-webkit-details-marker]:hidden"
                            aria-label="Buka menu"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.6}
                                    d="M4 7h16M4 12h16M4 17h16"
                                />
                            </svg>
                        </summary>

                        <div className="brutal-panel absolute right-0 top-[calc(100%+1rem)] z-20 grid w-[min(20rem,calc(100vw-2rem))] gap-3 bg-[var(--tm-paper-strong)] p-4">
                            {NAV_LINKS.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="display-font rounded-2xl border-[3px] border-[var(--tm-line)] bg-white px-4 py-3 text-lg uppercase"
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <div className="grid gap-3 border-t-[3px] border-dashed border-[var(--tm-line)] pt-3 md:grid-cols-2">
                                <Link href="/login" className="brutal-button-secondary">
                                    Masuk
                                </Link>
                                <Link href="/register" className="brutal-button">
                                    Daftar
                                </Link>
                            </div>
                        </div>
                    </details>
                </div>
            </div>
        </nav>
    );
}
