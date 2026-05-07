import Link from "next/link";
import CreateBoardForm from "@/components/dashboard/CreateBoardForm";
import { requireCompletedProfile } from "@/lib/auth";

export default async function NewBoardPage() {
    await requireCompletedProfile();

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

                <CreateBoardForm />
            </div>
        </div>
    );
}
