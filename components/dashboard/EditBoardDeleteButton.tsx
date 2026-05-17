"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteCompetitionIdeaBoard } from "@/app/(dashboard)/dashboard/actions";
import ConfirmationDialog from "@/components/shared/ConfirmationDialog";

interface EditBoardDeleteButtonProps {
    id: string;
}

export default function EditBoardDeleteButton({ id }: EditBoardDeleteButtonProps) {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);

    const handleDelete = async () => {
        const formData = new FormData();
        formData.set("id", id);

        setError(null);
        setIsPending(true);
        const result = await deleteCompetitionIdeaBoard(formData);

        if (!result.success) {
            setError(result.formError ?? "Terjadi kesalahan saat menghapus ide lomba.");
            setIsPending(false);
            return;
        }

        setIsConfirmOpen(false);
        router.replace("/dashboard/boards?deleted=1");
        router.refresh();
    };

    return (
        <div className="w-full">
            {error && <div className="mb-3 brutal-alert-error text-sm">{error}</div>}
            <button
                type="button"
                disabled={isPending}
                className="brutal-button-danger w-full disabled:opacity-60"
                onClick={() => setIsConfirmOpen(true)}
            >
                {isPending ? "Menghapus..." : "Hapus board"}
            </button>
            <ConfirmationDialog
                isOpen={isConfirmOpen}
                isPending={isPending}
                title="Hapus board ini permanen?"
                description="Board yang sedang Anda edit akan dihapus, termasuk slot rekrutmen yang terkait di halaman ini."
                cancelLabel="Batal"
                confirmLabel="Hapus sekarang"
                onCancel={() => setIsConfirmOpen(false)}
                onConfirm={handleDelete}
            />
        </div>
    );
}
