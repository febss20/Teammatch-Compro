"use client";

import { AlertTriangle, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

interface ConfirmationDialogProps {
    cancelLabel?: string;
    confirmLabel?: string;
    description: string;
    isOpen: boolean;
    isPending?: boolean;
    onCancel: () => void;
    onConfirm: () => void | Promise<void>;
    title: string;
}

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
    if (!container) {
        return [];
    }

    return Array.from(
        container.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
    );
}

export default function ConfirmationDialog({
    cancelLabel = "Batal",
    confirmLabel = "Lanjutkan",
    description,
    isOpen,
    isPending = false,
    onCancel,
    onConfirm,
    title,
}: ConfirmationDialogProps) {
    const dialogRef = useRef<HTMLDivElement | null>(null);
    const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
    const previousActiveElementRef = useRef<HTMLElement | null>(null);
    const titleId = useId();
    const descriptionId = useId();

    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        previousActiveElementRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const focusTimeout = window.setTimeout(() => {
            cancelButtonRef.current?.focus();
        }, 0);

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !isPending) {
                event.preventDefault();
                onCancel();
                return;
            }

            if (event.key !== "Tab") {
                return;
            }

            const focusableElements = getFocusableElements(dialogRef.current);

            if (focusableElements.length === 0) {
                event.preventDefault();
                return;
            }

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (event.shiftKey && document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
                return;
            }

            if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            window.clearTimeout(focusTimeout);
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", handleKeyDown);
            previousActiveElementRef.current?.focus();
        };
    }, [isOpen, isPending, onCancel]);

    if (!isOpen) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(19,19,19,0.76)] p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !isPending) {
                    onCancel();
                }
            }}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                className="brutal-panel w-full max-w-xl bg-[var(--tm-paper-strong)] p-6 md:p-7"
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[3px] border-[var(--tm-line)] bg-[var(--tm-surface-danger)] text-[var(--tm-line)] shadow-[4px_4px_0_var(--tm-line)]">
                            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
                        </div>
                        <div className="space-y-3">
                            <div className="section-kicker">Konfirmasi</div>
                            <div className="space-y-2">
                                <h2 id={titleId} className="display-font text-4xl leading-none text-[var(--tm-line)]">
                                    {title}
                                </h2>
                                <p id={descriptionId} className="max-w-lg text-base leading-7 text-[var(--tm-muted)]">
                                    {description}
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        aria-label="Tutup dialog konfirmasi"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-[var(--tm-line)] bg-[var(--tm-paper-strong)] text-[var(--tm-line)] shadow-[3px_3px_0_var(--tm-line)] disabled:opacity-60"
                        disabled={isPending}
                        onClick={onCancel}
                    >
                        <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                </div>

                <div className="mt-6 brutal-panel-soft bg-[var(--tm-surface-warm)] p-4 text-sm leading-7 text-[var(--tm-muted)]">
                    Tindakan ini akan menghapus data dari daftar aktif. Lanjutkan hanya jika Anda yakin.
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                        ref={cancelButtonRef}
                        type="button"
                        className="brutal-button-secondary w-full sm:w-auto"
                        disabled={isPending}
                        onClick={onCancel}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className="brutal-button-danger w-full sm:w-auto"
                        disabled={isPending}
                        onClick={() => void onConfirm()}
                    >
                        {isPending ? "Memproses..." : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
