import NotificationsList from "@/components/dashboard/NotificationsList";
import { requireCompletedProfile } from "@/lib/auth";
import { getNotificationCenter } from "@/lib/dashboard/data";

export default async function NotificationsPage() {
    const { user } = await requireCompletedProfile();
    const notifications = await getNotificationCenter(user.id);

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="section-kicker">Notifications</div>
                <h1 className="display-font text-6xl leading-[0.9] md:text-7xl">PANTAU SEMUA UPDATE PENTING</h1>
            </div>

            {notifications.length > 0 ? (
                <NotificationsList notifications={notifications} />
            ) : (
                <div className="brutal-panel bg-[var(--tm-paper-strong)] p-8">
                    <p className="display-font text-4xl leading-none">Belum ada notifikasi</p>
                    <p className="mt-3 text-base leading-8 text-[var(--tm-muted)] break-words">
                        Request, lamaran, komitmen, dan reminder akan muncul di sini.
                    </p>
                </div>
            )}
        </div>
    );
}
