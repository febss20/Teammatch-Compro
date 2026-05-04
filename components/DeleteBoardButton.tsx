"use client";

import { deleteCompetitionIdeaBoard } from "@/app/(dashboard)/dashboard/actions";

interface DeleteBoardButtonProps {
    id: string;
}

export default function DeleteBoardButton({ id }: DeleteBoardButtonProps) {
    return (
        <form
            action={deleteCompetitionIdeaBoard}
            onSubmit={(event) => {
                const confirmed = window.confirm("Hapus board ide ini?");

                if (!confirmed) {
                    event.preventDefault();
                }
            }}
        >
            <input type="hidden" name="id" value={id} />
            <button
                type="submit"
                className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-600 transition-colors hover:border-red-500 hover:text-red-700"
            >
                Delete
            </button>
        </form>
    );
}
