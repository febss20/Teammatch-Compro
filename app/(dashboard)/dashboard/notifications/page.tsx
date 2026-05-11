import DashboardEmptyState from "@/components/dashboard/DashboardEmptyState";
import DashboardRealtimeRefresh from "@/components/dashboard/DashboardRealtimeRefresh";
import NotificationsList from "@/components/dashboard/NotificationsList";
import { requireCompletedProfile } from "@/lib/auth";
import { getNotificationFeed } from "@/lib/notifications/data";

export default async function NotificationsPage() {
    const { user } = await requireCompletedProfile();
    const notificationFeed = await getNotificationFeed(user.id, 50);

    return (
        <div className="space-y-6">
            <DashboardRealtimeRefresh
                scopeKey={`notifications-${user.id}`}
                subscriptions={[
                    {
                        event: "*",
                        filter: `user_id=eq.${user.id}`,
                        table: "user_notifications",
                    },
                ]}
            />
            <div className="space-y-4">
                <div className="section-kicker">Notifications</div>
                <h1 className="display-font text-6xl leading-[0.9] md:text-7xl">PANTAU SEMUA UPDATE PENTING</h1>
                <div className="flex flex-wrap gap-3">
                    <span className="brutal-chip bg-[var(--tm-accent-2)]">{notificationFeed.unreadCount} unread</span>
                    <span className="brutal-chip bg-white">{notificationFeed.notifications.length} total event</span>
                </div>
            </div>

            {notificationFeed.notifications.length > 0 ? (
                <NotificationsList notifications={notificationFeed.notifications} unreadCount={notificationFeed.unreadCount} />
            ) : (
                <DashboardEmptyState
                    actionHref="/dashboard"
                    actionLabel="Kembali ke dashboard"
                    title="Belum ada notifikasi"
                    body="Request, lamaran, komitmen, dan reminder akan muncul di sini."
                />
            )}
        </div>
    );
}
