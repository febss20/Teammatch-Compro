"use client";

import { useActionState } from "react";
import { recordCompetitionResult } from "@/app/(dashboard)/dashboard/actions";
import { teamResultInitialState } from "@/lib/forms";

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
                    disabled={pending}
                />
            </div>
            <div className="grid gap-2">
                <label htmlFor="competition_ended_at" className="brutal-label">
                    Tanggal Lomba Selesai
                </label>
                <input id="competition_ended_at" name="competition_ended_at" type="date" className="brutal-input" disabled={pending} />
            </div>
            <button type="submit" disabled={pending} className="brutal-button-secondary">
                {pending ? "Mencatat..." : "Catat Hasil Lomba"}
            </button>
        </form>
    );
}
