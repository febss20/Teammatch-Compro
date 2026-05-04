import Link from "next/link";
import { notFound } from "next/navigation";
import EditBoardForm from "@/components/EditBoardForm";
import DeleteBoardButton from "@/components/DeleteBoardButton";
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
        <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#effcff_100%)] px-4 py-12">
            <div className="mx-auto max-w-6xl space-y-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">
                            Dashboard / Edit Board
                        </p>
                        <h1 className="mt-3 text-4xl font-black tracking-tight text-gray-900">Edit board ide</h1>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link
                            href="/dashboard"
                            className="rounded-full border border-gray-300 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-700 transition-colors hover:border-gray-900 hover:text-gray-950"
                        >
                            Kembali ke Dashboard
                        </Link>
                        <DeleteBoardButton id={board.id} />
                    </div>
                </div>

                <EditBoardForm board={board} />
            </div>
        </div>
    );
}
