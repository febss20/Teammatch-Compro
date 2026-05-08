"use client";

import { useActionState } from "react";
import { saveTeamResource } from "@/app/(dashboard)/dashboard/actions";
import { teamResourceInitialState } from "@/lib/forms";

interface TeamResourceFormProps {
    teamId: string;
}

function firstError(fieldErrors: Partial<Record<string, string[]>>, fieldName: string): string | null {
    return fieldErrors[fieldName]?.[0] ?? null;
}

export default function TeamResourceForm({ teamId }: TeamResourceFormProps) {
    const [state, formAction, pending] = useActionState(saveTeamResource, teamResourceInitialState);

    return (
        <form action={formAction} className="brutal-panel grid gap-4 bg-[var(--tm-paper-strong)] p-5">
            <input type="hidden" name="team_id" value={teamId} />

            {state.formError && <div className="brutal-alert-error text-sm">{state.formError}</div>}
            {state.success && state.message && <div className="brutal-alert-success text-sm">{state.message}</div>}

            <div className="grid gap-2">
                <label htmlFor="resource_type" className="brutal-label">
                    Jenis Resource
                </label>
                <input
                    id="resource_type"
                    name="resource_type"
                    className="brutal-input"
                    placeholder="docs, chat, task-board"
                    disabled={pending}
                />
                {firstError(state.fieldErrors, "resource_type") && (
                    <p className="text-sm font-semibold text-[var(--tm-danger)]">
                        {firstError(state.fieldErrors, "resource_type")}
                    </p>
                )}
            </div>

            <div className="grid gap-2">
                <label htmlFor="label" className="brutal-label">
                    Label
                </label>
                <input id="label" name="label" className="brutal-input" placeholder="Notion Sprint Board" disabled={pending} />
                {firstError(state.fieldErrors, "label") && (
                    <p className="text-sm font-semibold text-[var(--tm-danger)]">{firstError(state.fieldErrors, "label")}</p>
                )}
            </div>

            <div className="grid gap-2">
                <label htmlFor="url" className="brutal-label">
                    URL
                </label>
                <input id="url" name="url" className="brutal-input" placeholder="https://..." disabled={pending} />
                {firstError(state.fieldErrors, "url") && (
                    <p className="text-sm font-semibold text-[var(--tm-danger)]">{firstError(state.fieldErrors, "url")}</p>
                )}
            </div>

            <button type="submit" disabled={pending} className="brutal-button">
                {pending ? "Menyimpan..." : "Tambah resource"}
            </button>
        </form>
    );
}
