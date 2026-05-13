"use client";

import { useActionState, useMemo, useState } from "react";
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
    const defaultMessage = `Halo, saya tertarik bergabung di peran ${defaultSlot?.roleName ?? "ini"} karena skill saya cukup relevan.`;
    const [selectedSlotId, setSelectedSlotId] = useState<string>(defaultSlot?.id ?? "");
    const [selectedRole, setSelectedRole] = useState<string>(defaultSlot?.roleName ?? "");
    const [message, setMessage] = useState<string>(defaultMessage);
    const selectedSlot = useMemo(
        () => board.slots.find((slot) => slot.id === selectedSlotId) ?? defaultSlot ?? null,
        [board.slots, defaultSlot, selectedSlotId],
    );
    const relevantSkills = selectedSlot?.requiredSkills?.length ? selectedSlot.requiredSkills : board.requiredSkills;

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
                    value={selectedSlotId}
                    disabled={pending}
                    onChange={(event) => {
                        const nextSlotId = event.target.value;
                        const nextSlot = board.slots.find((slot) => slot.id === nextSlotId) ?? null;
                        setSelectedSlotId(nextSlotId);
                        if (nextSlot) {
                            setSelectedRole(nextSlot.roleName);
                        }
                    }}
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
                    value={selectedRole}
                    disabled={pending}
                    onChange={(event) => setSelectedRole(event.target.value)}
                />
                {getFirstFieldError(state.fieldErrors, "selected_role") && (
                    <p className="text-sm font-semibold text-[var(--tm-danger)]">
                        {getFirstFieldError(state.fieldErrors, "selected_role")}
                    </p>
                )}
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
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    disabled={pending}
                />
                <p className="text-sm text-[var(--tm-muted)]">Maksimal 200 karakter.</p>
                {getFirstFieldError(state.fieldErrors, "message") && (
                    <p className="text-sm font-semibold text-[var(--tm-danger)]">
                        {getFirstFieldError(state.fieldErrors, "message")}
                    </p>
                )}
            </div>

            <div className="brutal-panel-soft p-4">
                <p className="display-font text-2xl leading-none">Skill Match Snapshot</p>
                <div className="mt-3 flex flex-wrap gap-2">
                    {relevantSkills.map((skill) => (
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
