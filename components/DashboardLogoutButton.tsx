import { logoutAction } from "@/app/(dashboard)/dashboard/actions";

export default function DashboardLogoutButton() {
    return (
        <form action={logoutAction}>
            <button type="submit" className="brutal-button-secondary">
                Logout
            </button>
        </form>
    );
}
