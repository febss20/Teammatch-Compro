"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_LINKS = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/login?next=/dashboard/boards/new", label: "Post Idea" },
    { href: "/services", label: "Services" },
    { href: "/gallery", label: "Gallery" },
    { href: "/contact", label: "Contact" },
];

const ACTION_LINKS = [
    { href: "/login", label: "Login" },
    { href: "/register", label: "Register" },
];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    return (
        <nav className="sticky top-0 z-50 border-b-[3px] border-[var(--tm-line)] bg-[rgba(255,249,239,0.92)] backdrop-blur">
            <div className="page-frame py-4">
                <div className="brutal-panel flex items-center justify-between gap-4 bg-[rgba(255,249,239,0.94)] px-5 py-4 md:px-7">
                    <Link href="/" className="display-font text-3xl leading-none text-[var(--tm-line)] md:text-4xl">
                        TeamMatch
                    </Link>

                    <div className="hidden items-center gap-3 lg:flex">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`display-font rounded-full border-[3px] px-4 py-2 text-base uppercase tracking-[0.04em] ${
                                    isActive(link.href)
                                        ? "border-[var(--tm-line)] bg-[var(--tm-accent-2)] shadow-[4px_4px_0_var(--tm-line)]"
                                        : "border-transparent bg-transparent hover:border-[var(--tm-line)] hover:bg-white"
                                }`}
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

                    <button
                        className="inline-flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-[var(--tm-line)] bg-[var(--tm-accent)] shadow-[4px_4px_0_var(--tm-line)] lg:hidden"
                        onClick={() => setIsOpen(!isOpen)}
                        aria-label={isOpen ? "Close menu" : "Open menu"}
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.6}
                                d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 7h16M4 12h16M4 17h16"}
                            />
                        </svg>
                    </button>
                </div>

                {isOpen && (
                    <div className="brutal-panel mt-4 grid gap-3 bg-[var(--tm-paper-strong)] p-4 lg:hidden">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                className={`display-font rounded-2xl border-[3px] px-4 py-3 text-lg uppercase ${
                                    isActive(link.href)
                                        ? "border-[var(--tm-line)] bg-[var(--tm-accent-2)]"
                                        : "border-[var(--tm-line)] bg-white"
                                }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="grid gap-3 border-t-[3px] border-dashed border-[var(--tm-line)] pt-3 md:grid-cols-2">
                            <Link href="/login" onClick={() => setIsOpen(false)} className="brutal-button-secondary">
                                Login
                            </Link>
                            <Link href="/register" onClick={() => setIsOpen(false)} className="brutal-button">
                                Register
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
