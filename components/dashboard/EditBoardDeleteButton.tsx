"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteCompetitionIdeaBoard } from "@/app/(dashboard)/dashboard/actions";

interface EditBoardDeleteButtonProps {
    id: string;
}

export default function EditBoardDeleteButton({ id }: EditBoardDeleteButtonProps) {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);

    return (
        <div className="w-full">
            {error && <div className="mb-3 brutal-alert-error text-sm">{error}</div>}
            <form
                action={async (formData: FormData) => {
                    const confirmed = window.confirm("Hapus board ide ini?");

                    if (!confirmed) {
                        return;
                    }

                    setError(null);
                    setIsPending(true);
                    const result = await deleteCompetitionIdeaBoard(formData);

                    if (!result.success) {
                        setError(result.formError ?? "Terjadi kesalahan saat menghapus ide lomba.");
                        setIsPending(false);
                        return;
                    }

                    router.replace("/dashboard/boards?deleted=1");
                    router.refresh();
                }}
                className="w-full"
            >
                <input type="hidden" name="id" value={id} />
                <button type="submit" disabled={isPending} className="brutal-button-danger w-full disabled:opacity-60">
                    {isPending ? "Deleting..." : "Delete"}
                </button>
            </form>
        </div>
    );
}
