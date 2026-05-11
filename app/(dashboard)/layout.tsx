import DashboardMaintenanceHeartbeat from "@/components/dashboard/DashboardMaintenanceHeartbeat";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { requireUser } from "@/lib/auth";
import { getUnreadNotificationCount } from "@/lib/notifications/data";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const user = await requireUser();
    const unreadNotificationCount = await getUnreadNotificationCount(user.id);

    return (
        <main className="min-h-screen px-4 py-8 md:py-10 overflow-hidden md:overflow-visible">
            <DashboardMaintenanceHeartbeat />
            <div className="page-frame flex flex-col gap-8">
                <DashboardNav notificationUnreadCount={unreadNotificationCount} notificationUserId={user.id} />
                <div className="min-w-0">{children}</div>
            </div>
        </main>
    );
}
