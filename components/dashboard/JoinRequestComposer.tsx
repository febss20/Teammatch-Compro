"use client";

import { useActionState } from "react";
import { sendJoinRequest } from "@/app/(dashboard)/dashboard/actions";
import { joinRequestInitialState } from "@/lib/forms";
import { boardRoleOptions } from "@/lib/types";

interface JoinRequestComposerProps {
    boardId?: string | null;
    targetProfileId: string;
}

function firstError(fieldErrors: Partial<Record<string, string[]>>, fieldName: string) {
    return fieldErrors[fieldName]?.[0] ?? null;
}

export default function JoinRequestComposer({ boardId, targetProfileId }: JoinRequestComposerProps) {
    const [state, formAction, pending] = useActionState(sendJoinRequest, joinRequestInitialState);

    return (
        <form action={formAction} className="brutal-panel grid gap-4 bg-[var(--tm-paper-strong)] p-5">
            <input type="hidden" name="target_profile_id" value={targetProfileId} />
            {boardId && <input type="hidden" name="board_id" value={boardId} />}

            {state.formError && <div className="brutal-alert-error text-sm">{state.formError}</div>}
            {state.success && state.message && <div className="brutal-alert-success text-sm">{state.message}</div>}

            <div className="grid gap-2">
                <label htmlFor="selected_role" className="brutal-label">
                    Peran yang Anda Tawarkan
                </label>
                <select
                    id="selected_role"
                    name="selected_role"
                    className="brutal-select"
                    defaultValue={boardRoleOptions[0]}
                    disabled={pending}
                >
                    {boardRoleOptions.map((role) => (
                        <option key={role} value={role}>
                            {role}
                        </option>
                    ))}
                </select>
                {firstError(state.fieldErrors, "selected_role") && (
                    <p className="text-sm font-semibold text-[var(--tm-danger)]">
                        {firstError(state.fieldErrors, "selected_role")}
                    </p>
                )}
            </div>

            <div className="grid gap-2">
                <label htmlFor="message" className="brutal-label">
                    Pesan Request
                </label>
                <textarea
                    id="message"
                    name="message"
                    rows={4}
                    className="brutal-textarea"
                    defaultValue="Halo, saya tertarik berkolaborasi karena skill saya relevan dan availability saya cukup fleksibel."
                    disabled={pending}
                />
                <p className="text-sm text-[var(--tm-muted)]">Maksimal 150 karakter.</p>
                {firstError(state.fieldErrors, "message") && (
                    <p className="text-sm font-semibold text-[var(--tm-danger)]">{firstError(state.fieldErrors, "message")}</p>
                )}
            </div>

            <button type="submit" disabled={pending} className="brutal-button">
                {pending ? "Mengirim..." : "Kirim Request"}
            </button>
        </form>
    );
}
