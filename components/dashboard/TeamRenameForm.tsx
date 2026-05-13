"use client";

import { useActionState } from "react";
import { renameTeam } from "@/app/(dashboard)/dashboard/actions";
import { teamRenameInitialState } from "@/lib/forms";
import { getFirstFieldError } from "@/lib/shared/form-errors";
import { getStringFormValue } from "@/lib/shared/form-values";

export default function TeamRenameForm({ teamId, teamName }: { teamId: string; teamName: string }) {
    const [state, formAction, pending] = useActionState(renameTeam, teamRenameInitialState);

    return (
        <form action={formAction} className="grid gap-3">
            <input type="hidden" name="team_id" value={teamId} />
            {state.formError && <div className="brutal-alert-error text-sm">{state.formError}</div>}
            {state.success && state.message && <div className="brutal-alert-success text-sm">{state.message}</div>}
            <div className="grid gap-2">
                <label htmlFor="team_name" className="brutal-label">
                    Nama Tim
                </label>
                <input
                    id="team_name"
                    name="team_name"
                    defaultValue={getStringFormValue(state.values, "team_name") ?? teamName}
                    className="brutal-input"
                    disabled={pending}
                />
                {getFirstFieldError(state.fieldErrors, "team_name") && (
                    <p className="text-sm font-semibold text-[var(--tm-danger)]">
                        {getFirstFieldError(state.fieldErrors, "team_name")}
                    </p>
                )}
            </div>
            <button type="submit" disabled={pending} className="brutal-button-secondary">
                {pending ? "Menyimpan..." : "Ubah Nama Tim"}
            </button>
        </form>
    );
}
