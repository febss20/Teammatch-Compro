import PasswordChangeForm from "@/components/dashboard/PasswordChangeForm";
import SettingsForm from "@/components/dashboard/SettingsForm";
import { requireCompletedProfile } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
    const { user, profile } = await requireCompletedProfile();
    const supabase = await createServerSupabaseClient();
    const { data: preferences } = await supabase
        .from("notification_preferences")
        .select("request_updates, board_updates, commitment_updates, reminder_updates")
        .eq("user_id", user.id)
        .maybeSingle();

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="section-kicker">Settings</div>
                <h1 className="display-font text-6xl leading-[0.9] md:text-7xl">ATUR PRIVASI DAN NOTIFIKASI</h1>
            </div>

            <div className="grid gap-6">
                <SettingsForm profile={profile} preferences={preferences} />
                <PasswordChangeForm />
            </div>
        </div>
    );
}
