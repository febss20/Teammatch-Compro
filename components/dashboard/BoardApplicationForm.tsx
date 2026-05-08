"use client";

import { useActionState } from "react";
import { applyToBoard } from "@/app/(dashboard)/dashboard/actions";
import { boardApplicationInitialState } from "@/lib/forms";
import { getFirstFieldError } from "@/lib/shared/form-errors";
import type { BoardSlotRecord, CompetitionIdeaBoardRecord } from "@/lib/types";

interface BoardApplicationFormProps {
    board: CompetitionIdeaBoardRecord;
}

export default function BoardApplicationForm({ board }: BoardApplicationFormProps) {
    const [state, formAction, pending] = useActionState(applyToBoard, boardApplicationInitialState);
    const defaultSlot = board.slots[0];

    return (
        <form action={formAction} className="brutal-panel grid gap-5 bg-[var(--tm-paper-strong)] p-6">
            <input type="hidden" name="board_id" value={board.id} />

            {state.formError && <div className="brutal-alert-error text-sm">{state.formError}</div>}
            {state.success && state.message && <div className="brutal-alert-success text-sm">{state.message}</div>}

            <div className="grid gap-2">
                <label htmlFor="board_slot_id" className="brutal-label">
                    Pilih Peran
                </label>
                <select
                    id="board_slot_id"
                    name="board_slot_id"
                    className="brutal-select"
                    defaultValue={defaultSlot?.id ?? ""}
                    disabled={pending}
                >
                    {board.slots.map((slot: BoardSlotRecord) => (
                        <option key={slot.id} value={slot.id}>
                            {slot.roleName} ({slot.slotCount} slot)
                        </option>
                    ))}
                </select>
                {getFirstFieldError(state.fieldErrors, "board_slot_id") && (
                    <p className="text-sm font-semibold text-[var(--tm-danger)]">
                        {getFirstFieldError(state.fieldErrors, "board_slot_id")}
                    </p>
                )}
            </div>

            <div className="grid gap-2">
                <label htmlFor="selected_role" className="brutal-label">
                    Peran yang Anda Ambil
                </label>
                <input
                    id="selected_role"
                    name="selected_role"
                    className="brutal-input"
                    defaultValue={defaultSlot?.roleName ?? ""}
                    disabled={pending}
                />
            </div>

            <div className="grid gap-2">
                <label htmlFor="message" className="brutal-label">
                    Pesan Lamaran
                </label>
                <textarea
                    id="message"
                    name="message"
                    rows={4}
                    className="brutal-textarea"
                    defaultValue={`Halo, saya tertarik bergabung di peran ${defaultSlot?.roleName ?? "ini"} karena skill saya cukup relevan.`}
                    disabled={pending}
                />
                <p className="text-sm text-[var(--tm-muted)]">Maksimal 200 karakter.</p>
            </div>

            <div className="brutal-panel-soft p-4">
                <p className="display-font text-2xl leading-none">Skill Match Snapshot</p>
                <div className="mt-3 flex flex-wrap gap-2">
                    {board.requiredSkills.map((skill) => (
                        <span key={skill} className="brutal-chip bg-[var(--tm-accent-2)]">
                            {skill}
                        </span>
                    ))}
                </div>
            </div>

            <button type="submit" disabled={pending} className="brutal-button">
                {pending ? "Mengirim lamaran..." : "Gabung Tim"}
            </button>
        </form>
    );
}
