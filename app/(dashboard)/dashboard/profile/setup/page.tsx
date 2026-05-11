import { redirect } from "next/navigation";
import ProfileSetupWizard from "@/components/dashboard/ProfileSetupWizard";
import { getCurrentProfile, requireUser } from "@/lib/auth";
import { getTaxonomies } from "@/lib/dashboard/data";

export default async function ProfileSetupPage() {
    await requireUser();
    const [profile, taxonomies] = await Promise.all([getCurrentProfile(), getTaxonomies()]);

    if (profile?.profileCompletedAt) {
        redirect("/dashboard");
    }

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="section-kicker">Profile setup</div>
                <h1 className="display-font text-6xl leading-[0.9] md:text-7xl">SIAPKAN PROFIL ANDA UNTUK MATCHING</h1>
                <p className="max-w-3xl text-base leading-8 text-[var(--tm-muted)]">
                    Selesaikan tiga langkah singkat ini agar TeamMatch bisa menampilkan kandidat, board, dan rekomendasi yang
                    lebih relevan.
                </p>
            </div>

            <ProfileSetupWizard profile={profile} skills={taxonomies.skills} competitionTypes={taxonomies.competitionTypes} />
        </div>
    );
}
