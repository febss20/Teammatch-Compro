import Link from "next/link";
import { notFound } from "next/navigation";
import EditBoardDeleteButton from "@/components/dashboard/EditBoardDeleteButton";
import EditBoardForm from "@/components/dashboard/EditBoardForm";
import { requireCompletedProfile } from "@/lib/auth";
import { getBoardById } from "@/lib/dashboard/data";

export default async function EditBoardPage({ params }: { params: Promise<{ id: string }> }) {
    const { user } = await requireCompletedProfile();
    const { id } = await params;
    const board = await getBoardById(id);

    if (!board || board.userId !== user.id) {
        notFound();
    }

    return (
        <div className="space-y-8">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                <div className="space-y-4">
                    <div className="section-kicker">Boards / Edit</div>
                    <h1 className="display-font text-6xl leading-[0.9] md:text-7xl">RAPIKAN BOARD DAN SLOT REKRUTMEN</h1>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Link href="/dashboard/boards" className="brutal-button-secondary">
                        Kembali ke boards
                    </Link>
                    <EditBoardDeleteButton id={board.id} />
                </div>
            </div>

            <EditBoardForm board={board} />
        </div>
    );
}
