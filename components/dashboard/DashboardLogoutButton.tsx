import { logoutAction } from "@/app/(dashboard)/dashboard/actions";
import PendingSubmitButton from "@/components/shared/PendingSubmitButton";

export default function DashboardLogoutButton() {
    return (
        <form action={logoutAction}>
            <PendingSubmitButton className="brutal-button-secondary" idleLabel="Keluar" pendingLabel="Keluar..." />
        </form>
    );
}
