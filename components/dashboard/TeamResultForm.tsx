"use client";

import { useActionState } from "react";
import { recordCompetitionResult } from "@/app/(dashboard)/dashboard/actions";
import { teamResultInitialState } from "@/lib/forms";
import { getFirstFieldError } from "@/lib/shared/form-errors";
import { getStringFormValue } from "@/lib/shared/form-values";

export default function TeamResultForm({ teamId }: { teamId: string }) {
    const [state, formAction, pending] = useActionState(recordCompetitionResult, teamResultInitialState);

    return (
        <form action={formAction} className="grid gap-3">
            <input type="hidden" name="team_id" value={teamId} />
            {state.formError && <div className="brutal-alert-error text-sm">{state.formError}</div>}
            {state.success && state.message && <div className="brutal-alert-success text-sm">{state.message}</div>}
            <div className="grid gap-2">
                <label htmlFor="result_summary" className="brutal-label">
                    Hasil Terbaik
                </label>
                <input
                    id="result_summary"
                    name="result_summary"
                    className="brutal-input"
                    placeholder="Contoh: Finalis nasional"
                    defaultValue={getStringFormValue(state.values, "result_summary") ?? ""}
                    disabled={pending}
                />
                {getFirstFieldError(state.fieldErrors, "result_summary") && (
                    <p className="text-sm font-semibold text-[var(--tm-danger)]">
                        {getFirstFieldError(state.fieldErrors, "result_summary")}
                    </p>
                )}
            </div>
            <div className="grid gap-2">
                <label htmlFor="competition_ended_at" className="brutal-label">
                    Tanggal Lomba Selesai
                </label>
                <input
                    id="competition_ended_at"
                    name="competition_ended_at"
                    type="date"
                    className="brutal-input"
                    defaultValue={getStringFormValue(state.values, "competition_ended_at") ?? ""}
                    disabled={pending}
                />
                {getFirstFieldError(state.fieldErrors, "competition_ended_at") && (
                    <p className="text-sm font-semibold text-[var(--tm-danger)]">
                        {getFirstFieldError(state.fieldErrors, "competition_ended_at")}
                    </p>
                )}
            </div>
            <button type="submit" disabled={pending} className="brutal-button-secondary">
                {pending ? "Mencatat..." : "Catat Hasil Lomba"}
            </button>
        </form>
    );
}
