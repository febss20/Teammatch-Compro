import PasswordChangeForm from "@/components/dashboard/PasswordChangeForm";
import SettingsForm from "@/components/dashboard/SettingsForm";
import { requireCompletedProfile } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
    const { user, profile } = await requireCompletedProfile();
    const supabase = await createServerSupabaseClient();
    const { data: preferences, error: preferencesError } = await supabase
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
                {preferencesError ? (
                    <div className="brutal-panel grid gap-3 bg-[var(--tm-paper-strong)] p-6 text-[var(--tm-line)]">
                        <p className="display-font text-3xl leading-none">Preferensi notifikasi belum bisa dimuat</p>
                        <p className="text-base leading-8 text-[var(--tm-muted)]">
                            Pengaturan privasi dan notifikasi tidak ditampilkan dulu supaya nilai default tidak menimpa data
                            yang gagal dibaca.
                        </p>
                        <p className="text-sm font-semibold text-[var(--tm-danger)]">{preferencesError.message}</p>
                    </div>
                ) : (
                    <SettingsForm profile={profile} preferences={preferences} />
                )}
                <PasswordChangeForm />
            </div>
        </div>
    );
}
