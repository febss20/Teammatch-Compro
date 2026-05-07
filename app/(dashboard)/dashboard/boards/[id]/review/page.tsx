import { notFound } from "next/navigation";
import BoardReviewList from "@/components/dashboard/BoardReviewList";
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
            <div className="space-y-4">
                <div className="section-kicker">Review pelamar</div>
                <h1 className="display-font text-6xl leading-[0.9] md:text-7xl">PILAH PELAMAR UNTUK {board.title}</h1>
            </div>

            {applications.length > 0 ? (
                <BoardReviewList applications={applications} candidatesById={candidatesById} />
            ) : (
                <div className="brutal-panel bg-[var(--tm-paper-strong)] p-8">
                    <p className="display-font text-4xl leading-none">Belum ada pelamar masuk</p>
                    <p className="mt-3 text-base leading-8 text-[var(--tm-muted)] break-words">
                        Setelah kandidat mulai melamar, Anda bisa menerima, menolak, atau menyimpan mereka dari halaman ini.
                    </p>
                </div>
            )}
        </div>
    );
}
