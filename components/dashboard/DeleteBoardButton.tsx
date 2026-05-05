"use client";

interface DeleteBoardButtonProps {
    disabled: boolean;
    id: string;
    onDelete: (formData: FormData) => Promise<void>;
    pending: boolean;
}

export default function DeleteBoardButton({ disabled, id, onDelete, pending }: DeleteBoardButtonProps) {
    return (
        <form
            action={async (formData: FormData) => {
                const confirmed = window.confirm("Hapus board ide ini?");

                if (!confirmed) {
                    return;
                }

                await onDelete(formData);
            }}
            className="w-full"
        >
            <input type="hidden" name="id" value={id} />
            <button type="submit" disabled={disabled} className="brutal-button-danger w-full disabled:opacity-60">
                {pending ? "Deleting..." : "Delete"}
            </button>
        </form>
    );
}
