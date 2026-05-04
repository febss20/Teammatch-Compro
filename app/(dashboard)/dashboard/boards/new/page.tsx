import Link from "next/link";
import CreateBoardForm from "@/components/dashboard/CreateBoardForm";
import { requireUser } from "@/lib/auth";

export default async function NewBoardPage() {
    await requireUser();

    return (
        <div className="min-h-screen px-4 py-10 md:py-14">
            <div className="page-frame space-y-8">
                <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                    <div className="space-y-4">
                        <div className="section-kicker">Dashboard / New Board</div>
                        <h1 className="display-font text-6xl leading-[0.9] md:text-7xl">TULIS BRIEF YANG BISA DITINDAKLANJUTI</h1>
                    </div>
                    <Link href="/dashboard" className="brutal-button-secondary w-fit">
                        Kembali ke Dashboard
                    </Link>
                </div>

                <CreateBoardForm />
            </div>
        </div>
    );
}
