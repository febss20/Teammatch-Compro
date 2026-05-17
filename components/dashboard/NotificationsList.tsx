"use client";

import Link from "next/link";
import { markNotificationRead } from "@/app/(dashboard)/dashboard/actions";
import PendingSubmitButton from "@/components/shared/PendingSubmitButton";
import { sanitizeNotificationLinkPath } from "@/lib/notifications/contracts";
import { notificationCategoryLabels } from "@/lib/platform";
import type { NotificationRecord } from "@/lib/types";

interface NotificationsListProps {
    notifications: NotificationRecord[];
    unreadCount: number;
}

export default function NotificationsList({ notifications, unreadCount }: NotificationsListProps) {
    return (
        <div className="grid gap-4">
            <div className="brutal-panel-soft flex flex-wrap items-center justify-between gap-3 p-4">
                <p className="display-font text-2xl leading-none">Unread state</p>
                <span className="brutal-chip bg-[var(--tm-accent)]">{unreadCount} belum dibaca</span>
            </div>
            {notifications.map((notification) => {
                const safeLinkPath = sanitizeNotificationLinkPath(notification.linkPath);

                return (
                    <article key={notification.id} className="brutal-panel grid gap-4 bg-[var(--tm-paper-strong)] p-5">
                        <div className="flex flex-wrap gap-3">
                            <span className="brutal-chip bg-[var(--tm-accent-2)]">
                                {notificationCategoryLabels[notification.category]}
                            </span>
                            <span className={`brutal-chip ${notification.isRead ? "bg-white" : "bg-[var(--tm-accent)]"}`}>
                                {notification.isRead ? "Read" : "Unread"}
                            </span>
                        </div>
                        <div>
                            <h3 className="display-font text-3xl leading-none">{notification.title}</h3>
                            <p className="mt-3 text-base leading-8 text-[var(--tm-muted)] break-words">{notification.body}</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {safeLinkPath && (
                                <Link href={safeLinkPath} className="brutal-button-secondary">
                                    Buka tautan
                                </Link>
                            )}
                            {!notification.isRead && (
                                <form action={markNotificationRead}>
                                    <input type="hidden" name="notification_id" value={notification.id} />
                                    <PendingSubmitButton
                                        className="brutal-button"
                                        idleLabel="Tandai dibaca"
                                        pendingLabel="Menandai..."
                                    />
                                </form>
                            )}
                        </div>
                    </article>
                );
            })}
        </div>
    );
}
