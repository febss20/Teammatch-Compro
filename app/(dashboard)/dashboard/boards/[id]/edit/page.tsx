import Link from "next/link";
import { notFound } from "next/navigation";
import EditBoardForm from "@/components/dashboard/EditBoardForm";
import EditBoardDeleteButton from "@/components/dashboard/EditBoardDeleteButton";
import { requireUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CompetitionIdeaBoardRecord } from "@/lib/types";

function mapBoardRecord(row: {
    id: string;
    user_id: string;
    title: string;
    competition_type: string;
    description: string;
    deadline: string;
    required_skills: string[];
    status: string;
    created_at: string;
    updated_at: string;
}): CompetitionIdeaBoardRecord {
    return {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        competitionType: row.competition_type,
        description: row.description,
        deadline: row.deadline,
        requiredSkills: row.required_skills,
        status: row.status === "closed" ? "closed" : "open",
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export default async function EditBoardPage({ params }: { params: Promise<{ id: string }> }) {
    const user = await requireUser();
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
        .from("competition_idea_boards")
        .select("id, user_id, title, competition_type, description, deadline, required_skills, status, created_at, updated_at")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) {
        throw new Error(`Gagal memuat board ide untuk diedit: ${error.message}`);
    }

    if (!data) {
        notFound();
    }

    const board = mapBoardRecord(data);

    return (
        <div className="min-h-screen px-4 py-10 md:py-14">
            <div className="page-frame space-y-8">
                <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                    <div className="space-y-4">
                        <div className="section-kicker">Dashboard / Edit board</div>
                        <h1 className="display-font text-6xl leading-[0.9] md:text-7xl">
                            RAPIKAN DETAIL BOARD SESUAI KEBUTUHAN
                        </h1>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link href="/dashboard" className="brutal-button-secondary">
                            Kembali ke dashboard
                        </Link>
                        <EditBoardDeleteButton id={board.id} />
                    </div>
                </div>

                <EditBoardForm board={board} />
            </div>
        </div>
    );
}
