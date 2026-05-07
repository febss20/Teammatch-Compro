"use client";

import { useActionState, useState } from "react";
import { updateCompetitionIdeaBoard } from "@/app/(dashboard)/dashboard/actions";
import { competitionIdeaBoardInitialState } from "@/lib/forms";
import {
    boardVisibilityOptions,
    competitionIdeaBoardStatusOptions,
    competitionTypeOptions,
    type CompetitionIdeaBoardRecord,
} from "@/lib/types";
import { boardVisibilityLabels, competitionTypeLabels } from "@/lib/platform";

const statusLabels: Record<(typeof competitionIdeaBoardStatusOptions)[number], string> = {
    open: "Aktif",
    closed: "Ditutup",
};

function firstError(fieldErrors: Partial<Record<string, string[]>>, fieldName: string): string | null {
    return fieldErrors[fieldName]?.[0] ?? null;
}

function getSelectValue(competitionType: string) {
    return competitionTypeOptions.includes(competitionType as (typeof competitionTypeOptions)[number])
        ? competitionType
        : "others";
}

function getOtherValue(competitionType: string) {
    return getSelectValue(competitionType) === "others" ? competitionType : "";
}

function getDateValue(deadline: string) {
    return deadline.slice(0, 10);
}

function getSkillsValue(requiredSkills: string[]) {
    return requiredSkills.join(", ");
}

export default function EditBoardForm({ board }: { board: CompetitionIdeaBoardRecord }) {
    const initialCompetitionType = getSelectValue(board.competitionType);
    const [selectedCompetitionType, setSelectedCompetitionType] = useState<string>(initialCompetitionType);
    const [state, formAction, pending] = useActionState(updateCompetitionIdeaBoard, competitionIdeaBoardInitialState);

    return (
        <form action={formAction} className="brutal-stack">
            <div className="brutal-panel grid gap-8 bg-[var(--tm-paper-strong)] p-6 md:p-8">
                <input type="hidden" name="id" value={board.id} />
                <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" />

                {state.formError && <div className="brutal-alert-error text-sm">{state.formError}</div>}

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="grid gap-2 md:col-span-2">
                        <label htmlFor="title" className="brutal-label">
                            Judul Ide
                        </label>
                        <input id="title" name="title" className="brutal-input" defaultValue={board.title} disabled={pending} />
                        {firstError(state.fieldErrors, "title") && (
                            <p className="text-sm font-semibold text-[var(--tm-danger)]">
                                {firstError(state.fieldErrors, "title")}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-2 md:col-span-2">
                        <label htmlFor="summary" className="brutal-label">
                            Ringkasan
                        </label>
                        <textarea
                            id="summary"
                            name="summary"
                            rows={3}
                            className="brutal-textarea"
                            defaultValue={board.summary ?? ""}
                            disabled={pending}
                        />
                    </div>
                    <div className="grid gap-2">
                        <label htmlFor="competition_type_select" className="brutal-label">
                            Jenis Lomba
                        </label>
                        <select
                            id="competition_type_select"
                            name="competition_type_select"
                            className="brutal-select"
                            value={selectedCompetitionType}
                            disabled={pending}
                            onChange={(event) => setSelectedCompetitionType(event.target.value)}
                        >
                            {competitionTypeOptions.map((option) => (
                                <option key={option} value={option}>
                                    {competitionTypeLabels[option]}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid gap-2">
                        <label htmlFor="status" className="brutal-label">
                            Status Board
                        </label>
                        <select
                            id="status"
                            name="status"
                            defaultValue={board.status}
                            className="brutal-select"
                            disabled={pending}
                        >
                            {competitionIdeaBoardStatusOptions.map((status) => (
                                <option key={status} value={status}>
                                    {statusLabels[status]}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid gap-2">
                        <label htmlFor="deadline" className="brutal-label">
                            Deadline
                        </label>
                        <input
                            id="deadline"
                            name="deadline"
                            type="date"
                            className="brutal-input"
                            defaultValue={getDateValue(board.deadline)}
                            disabled={pending}
                        />
                    </div>
                    <div className="grid gap-2">
                        <label htmlFor="visibility" className="brutal-label">
                            Visibilitas
                        </label>
                        <select
                            id="visibility"
                            name="visibility"
                            defaultValue={board.visibility}
                            className="brutal-select"
                            disabled={pending}
                        >
                            {boardVisibilityOptions.map((visibility) => (
                                <option key={visibility} value={visibility}>
                                    {boardVisibilityLabels[visibility]}
                                </option>
                            ))}
                        </select>
                    </div>
                    {selectedCompetitionType === "others" && (
                        <div className="grid gap-2 md:col-span-2">
                            <label htmlFor="competition_type_other" className="brutal-label">
                                Jenis Lomba Lainnya
                            </label>
                            <input
                                id="competition_type_other"
                                name="competition_type_other"
                                className="brutal-input"
                                defaultValue={getOtherValue(board.competitionType)}
                                disabled={pending}
                            />
                        </div>
                    )}
                    <div className="grid gap-2 md:col-span-2">
                        <label htmlFor="description" className="brutal-label">
                            Deskripsi Lengkap
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={6}
                            className="brutal-textarea"
                            defaultValue={board.description}
                            disabled={pending}
                        />
                    </div>
                    <div className="grid gap-2 md:col-span-2">
                        <label htmlFor="required_skills" className="brutal-label">
                            Skill Dibutuhkan
                        </label>
                        <input
                            id="required_skills"
                            name="required_skills"
                            className="brutal-input"
                            defaultValue={getSkillsValue(board.requiredSkills)}
                            disabled={pending}
                        />
                    </div>
                    <div className="grid gap-2">
                        <label htmlFor="slot_role_1" className="brutal-label">
                            Peran Utama
                        </label>
                        <input
                            id="slot_role_1"
                            name="slot_role_1"
                            className="brutal-input"
                            defaultValue={board.slots[0]?.roleName ?? "Frontend Engineer"}
                            disabled={pending}
                        />
                    </div>
                    <div className="grid gap-2">
                        <label htmlFor="slot_count_1" className="brutal-label">
                            Jumlah Slot Utama
                        </label>
                        <input
                            id="slot_count_1"
                            name="slot_count_1"
                            type="number"
                            min={1}
                            max={10}
                            className="brutal-input"
                            defaultValue={board.slots[0]?.slotCount ?? 1}
                            disabled={pending}
                        />
                    </div>
                    <div className="grid gap-2">
                        <label htmlFor="slot_role_2" className="brutal-label">
                            Peran Tambahan
                        </label>
                        <input
                            id="slot_role_2"
                            name="slot_role_2"
                            className="brutal-input"
                            defaultValue={board.slots[1]?.roleName ?? ""}
                            disabled={pending}
                        />
                    </div>
                    <div className="grid gap-2">
                        <label htmlFor="slot_count_2" className="brutal-label">
                            Jumlah Slot Tambahan
                        </label>
                        <input
                            id="slot_count_2"
                            name="slot_count_2"
                            type="number"
                            min={1}
                            max={10}
                            className="brutal-input"
                            defaultValue={board.slots[1]?.slotCount ?? 1}
                            disabled={pending}
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <button type="submit" disabled={pending} className="brutal-button min-w-[220px]">
                        {pending ? "Menyimpan perubahan..." : "Simpan perubahan"}
                    </button>
                </div>
            </div>
        </form>
    );
}
