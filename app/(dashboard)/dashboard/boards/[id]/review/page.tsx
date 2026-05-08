import { notFound } from "next/navigation";
import BoardReviewList from "@/components/dashboard/BoardReviewList";
import DashboardEmptyState from "@/components/dashboard/DashboardEmptyState";
import DashboardRealtimeRefresh from "@/components/dashboard/DashboardRealtimeRefresh";
import { requireCompletedProfile } from "@/lib/auth";
import { getBoardApplicationsForBoard, getBoardById, getCandidateDiscovery } from "@/lib/dashboard/data";

export default async function BoardReviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { user } = await requireCompletedProfile();
    const { id } = await params;
    const board = await getBoardById(id);

    if (!board || board.userId !== user.id) {
        notFound();
    }

    const [applications, candidateData] = await Promise.all([getBoardApplicationsForBoard(id), getCandidateDiscovery(user.id)]);
    const candidatesById = new Map(candidateData.candidates.map((candidate) => [candidate.profile.id, candidate]));

    return (
        <div className="space-y-6">
            <DashboardRealtimeRefresh
                scopeKey={`board-review-${board.id}`}
                subscriptions={[
                    {
                        event: "*",
                        filter: `board_id=eq.${board.id}`,
                        table: "board_applications",
                    },
                ]}
            />
            <div className="space-y-4">
                <div className="section-kicker">Review pelamar</div>
                <h1 className="display-font text-6xl leading-[0.9] md:text-7xl">PILAH PELAMAR UNTUK {board.title}</h1>
            </div>

            {applications.length > 0 ? (
                <BoardReviewList
                    applications={applications}
                    boardRequiredSkills={board.requiredSkills}
                    candidatesById={candidatesById}
                />
            ) : (
                <DashboardEmptyState
                    actionHref={`/dashboard/boards/${board.id}`}
                    actionLabel="Lihat board"
                    title="Belum ada pelamar masuk"
                    body="Setelah kandidat mulai melamar, Anda bisa menerima, menolak, atau menyimpan mereka dari halaman ini."
                />
            )}
        </div>
    );
}
