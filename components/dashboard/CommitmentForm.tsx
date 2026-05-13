"use client";

import { useActionState } from "react";
import { confirmTeamCommitment } from "@/app/(dashboard)/dashboard/actions";
import { commitmentInitialState } from "@/lib/forms";
import { getFirstFieldError } from "@/lib/shared/form-errors";
import { getStringFormValue } from "@/lib/shared/form-values";

export default function CommitmentForm({ defaultHours, teamMemberId }: { defaultHours: number; teamMemberId: string }) {
    const [state, formAction, pending] = useActionState(confirmTeamCommitment, commitmentInitialState);

    return (
        <form action={formAction} className="grid gap-3">
            <input type="hidden" name="team_member_id" value={teamMemberId} />
            {state.formError && <div className="brutal-alert-error text-sm">{state.formError}</div>}
            {state.success && state.message && <div className="brutal-alert-success text-sm">{state.message}</div>}
            <div className="grid gap-2">
                <label htmlFor={`hours_per_week-${teamMemberId}`} className="brutal-label">
                    Jam per Minggu
                </label>
                <input
                    id={`hours_per_week-${teamMemberId}`}
                    name="hours_per_week"
                    type="number"
                    min={1}
                    max={80}
                    defaultValue={getStringFormValue(state.values, "hours_per_week") ?? defaultHours}
                    className="brutal-input"
                    disabled={pending}
                />
                {getFirstFieldError(state.fieldErrors, "hours_per_week") && (
                    <p className="text-sm font-semibold text-[var(--tm-danger)]">
                        {getFirstFieldError(state.fieldErrors, "hours_per_week")}
                    </p>
                )}
            </div>
            <button type="submit" disabled={pending} className="brutal-button">
                {pending ? "Mengonfirmasi..." : "Konfirmasi Komitmen"}
            </button>
        </form>
    );
}
