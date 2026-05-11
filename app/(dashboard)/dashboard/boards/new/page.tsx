import Link from "next/link";
import CreateBoardForm from "@/components/dashboard/CreateBoardForm";
import { requireCompletedProfile } from "@/lib/auth";
import { getBoardDraft, getTaxonomies } from "@/lib/dashboard/data";

export default async function NewBoardPage() {
    const { user } = await requireCompletedProfile();
    const [draft, taxonomies] = await Promise.all([getBoardDraft(user.id), getTaxonomies()]);

    return (
        <div className="min-h-screen px-4 py-10 md:py-14">
            <div className="page-frame space-y-8">
                <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                    <div className="space-y-4">
                        <div className="section-kicker">Boards / Publish baru</div>
                        <h1 className="display-font text-6xl leading-[0.9] md:text-7xl">PUBLIKASIKAN IDE DAN BUKA REKRUTMEN</h1>
                    </div>
                    <Link href="/dashboard/boards" className="brutal-button-secondary w-fit">
                        Kembali ke boards
                    </Link>
                </div>

                <CreateBoardForm
                    key={draft?.updatedAt ?? "fresh-board"}
                    competitionTypes={taxonomies.competitionTypes}
                    draft={draft}
                />
            </div>
        </div>
    );
}
