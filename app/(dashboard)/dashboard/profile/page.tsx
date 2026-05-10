import { redirect } from "next/navigation";
import ProfileEditorForm from "@/components/dashboard/ProfileEditorForm";
import ProfileStats from "@/components/dashboard/ProfileStats";
import {TestimonialsDisplay} from "@/components/dashboard/TestimonialsDisplay";
import { getCurrentProfile } from "@/lib/auth";
import { getTaxonomies, getProfileTestimonials } from "@/lib/profile/data";

export default async function ProfilePage() {
    const profile = await getCurrentProfile();
    
    if (!profile) {
        redirect("/dashboard/profile/setup");
    }

    const [taxonomies, testimonials] = await Promise.all([
        getTaxonomies(),
        getProfileTestimonials(profile.id)
    ]);

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="section-kicker">Profile</div>
                <h1 className="display-font text-6xl leading-[0.9] md:text-7xl">KELOLA IDENTITAS DAN PREFERENSI ANDA</h1>
            </div>

            <div className="space-y-8">
                <ProfileStats profile={profile} />
                <TestimonialsDisplay testimonials={testimonials} maxDisplay={3} />
                <ProfileEditorForm profile={profile} skills={taxonomies.skills} competitionTypes={taxonomies.competitionTypes} />
            </div>
        </div>
    );
}
