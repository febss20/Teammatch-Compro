import Link from "next/link";
import CreateBoardForm from "@/components/CreateBoardForm";
import { requireUser } from "@/lib/auth";

export default async function NewBoardPage() {
    await requireUser();

    return (
        <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#effcff_100%)] px-4 py-12">
            <div className="mx-auto max-w-6xl space-y-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">Dashboard / New Board</p>
                        <h1 className="mt-3 text-4xl font-black tracking-tight text-gray-900">Buat board ide baru</h1>
                    </div>
                    <Link
                        href="/dashboard"
                        className="rounded-full border border-gray-300 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-700 transition-colors hover:border-gray-900 hover:text-gray-950"
                    >
                        Kembali ke Dashboard
                    </Link>
                </div>

                <CreateBoardForm />
            </div>
        </div>
    );
}
