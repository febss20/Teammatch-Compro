import { logoutAction } from "@/app/(dashboard)/dashboard/actions";

export default function DashboardLogoutButton() {
    return (
        <form action={logoutAction}>
            <button
                type="submit"
                className="rounded-full border border-gray-300 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-gray-700 transition-colors hover:border-gray-900 hover:text-gray-950"
            >
                Logout
            </button>
        </form>
    );
}
