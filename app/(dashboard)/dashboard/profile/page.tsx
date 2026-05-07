import { redirect } from "next/navigation";
import ProfileEditorForm from "@/components/dashboard/ProfileEditorForm";
import { getCurrentProfile } from "@/lib/auth";
import { getTaxonomies } from "@/lib/dashboard/data";

export default async function ProfilePage() {
    const [profile, taxonomies] = await Promise.all([getCurrentProfile(), getTaxonomies()]);

    if (!profile) {
        redirect("/dashboard/profile/setup");
    }

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="section-kicker">Profile</div>
                <h1 className="display-font text-6xl leading-[0.9] md:text-7xl">KELOLA IDENTITAS DAN PREFERENSI ANDA</h1>
            </div>

            <ProfileEditorForm profile={profile} skills={taxonomies.skills} competitionTypes={taxonomies.competitionTypes} />
        </div>
    );
}
