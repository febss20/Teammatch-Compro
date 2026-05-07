"use client";

import { useActionState } from "react";
import { confirmTeamCommitment } from "@/app/(dashboard)/dashboard/actions";
import { commitmentInitialState } from "@/lib/forms";

export default function CommitmentForm({
    defaultHours,
    teamMemberId,
}: {
    defaultHours: number;
    teamMemberId: string;
}) {
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
                    defaultValue={defaultHours}
                    className="brutal-input"
                    disabled={pending}
                />
            </div>
            <button type="submit" disabled={pending} className="brutal-button">
                {pending ? "Mengonfirmasi..." : "Konfirmasi Komitmen"}
            </button>
        </form>
    );
}
