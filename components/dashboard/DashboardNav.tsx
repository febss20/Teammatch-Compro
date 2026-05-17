"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/shared/Logo";
import NotificationsNavBadge from "@/components/dashboard/NotificationsNavBadge";

const LINKS = [
    { href: "/dashboard", label: "Home" },
    { href: "/dashboard/profile", label: "Profile" },
    { href: "/dashboard/find-team", label: "Find Team" },
    { href: "/dashboard/boards", label: "Boards" },
    { href: "/dashboard/requests", label: "Requests" },
    { href: "/dashboard/notifications", label: "Notifications" },
    { href: "/dashboard/settings", label: "Settings" },
];

interface DashboardNavProps {
    notificationUnreadCount: number;
    notificationUserId: string;
}

export default function DashboardNav({ notificationUnreadCount, notificationUserId }: DashboardNavProps) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="brutal-panel sticky top-4 z-40 bg-[var(--tm-paper-strong)] p-4 md:p-5">
            <div className="flex items-center justify-between">
                <Link href="/">
                    <Logo />
                </Link>

                <button
                    className="inline-flex h-12 w-12 items-center justify-center rounded-[12px] border-[3px] border-[var(--tm-line)] bg-[var(--tm-accent)] shadow-[4px_4px_0_var(--tm-line)] lg:hidden"
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

                <div className="hidden lg:flex flex-wrap items-center gap-2">
                    {LINKS.map((link) => {
                        const isActive =
                            pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(`${link.href}/`));
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`display-font rounded-full border-[3px] px-4 py-2 text-base uppercase tracking-[0.04em] ${
                                    isActive
                                        ? "border-[var(--tm-line)] bg-[var(--tm-accent-2)] shadow-[4px_4px_0_var(--tm-line)]"
                                        : "border-transparent bg-transparent hover:border-[var(--tm-line)] hover:bg-white"
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <span>{link.label}</span>
                                    {link.href === "/dashboard/notifications" && (
                                        <NotificationsNavBadge
                                            key={`${notificationUserId}-${notificationUnreadCount}-desktop`}
                                            initialUnreadCount={notificationUnreadCount}
                                            userId={notificationUserId}
                                        />
                                    )}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {isOpen && (
                <div className="mt-5 grid gap-3 border-t-[3px] border-dashed border-[var(--tm-line)] pt-5 lg:hidden">
                    {LINKS.map((link) => {
                        const isActive =
                            pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(`${link.href}/`));
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                className={`display-font rounded-[16px] border-[3px] px-4 py-3 text-xl leading-none ${
                                    isActive
                                        ? "border-[var(--tm-line)] bg-[var(--tm-accent-2)] shadow-[4px_4px_0_var(--tm-line)]"
                                        : "border-[var(--tm-line)] bg-white"
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <span>{link.label}</span>
                                    {link.href === "/dashboard/notifications" && (
                                        <NotificationsNavBadge
                                            key={`${notificationUserId}-${notificationUnreadCount}-mobile`}
                                            initialUnreadCount={notificationUnreadCount}
                                            userId={notificationUserId}
                                        />
                                    )}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            )}
        </nav>
    );
}
