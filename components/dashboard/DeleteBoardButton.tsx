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
            className="w-full"
        >
            <input type="hidden" name="id" value={id} />
            <button type="submit" className="brutal-button-danger w-full">
                Delete
            </button>
        </form>
    );
}
