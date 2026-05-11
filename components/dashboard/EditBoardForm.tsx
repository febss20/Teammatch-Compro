"use client";

import { useActionState, useMemo, useState } from "react";
import { updateCompetitionIdeaBoard } from "@/app/(dashboard)/dashboard/actions";
import { competitionIdeaBoardInitialState } from "@/lib/forms";
import {
    boardVisibilityOptions,
    competitionIdeaBoardStatusOptions,
    competitionTypeOptions,
    type CompetitionIdeaBoardRecord,
} from "@/lib/types";
import { boardVisibilityLabels, competitionTypeLabels } from "@/lib/platform";

interface RoleSlotInput {
    id: string;
    roleName: string;
    slotCount: string;
    requiredSkills: string;
}

const statusLabels: Record<(typeof competitionIdeaBoardStatusOptions)[number], string> = {
    open: "Aktif",
    closed: "Ditutup",
};

function firstError(fieldErrors: Partial<Record<string, string[]>>, fieldName: string): string | null {
    return fieldErrors[fieldName]?.[0] ?? null;
}

function getSelectValue(competitionType: string): string {
    return competitionTypeOptions.includes(competitionType as (typeof competitionTypeOptions)[number])
        ? competitionType
        : "others";
}

function getOtherValue(competitionType: string): string {
    return getSelectValue(competitionType) === "others" ? competitionType : "";
}

function getDateValue(deadline: string): string {
    return deadline.slice(0, 10);
}

function getSkillsValue(requiredSkills: string[]): string {
    return requiredSkills.join(", ");
}

function createInitialSlots(board: CompetitionIdeaBoardRecord): RoleSlotInput[] {
    if (board.slots.length > 0) {
        return board.slots.map((slot) => ({
            id: crypto.randomUUID(),
            roleName: slot.roleName,
            slotCount: String(slot.slotCount),
            requiredSkills: getSkillsValue(slot.requiredSkills),
        }));
    }

    return [
        {
            id: crypto.randomUUID(),
            roleName: "Frontend Engineer",
            slotCount: "1",
            requiredSkills: "",
        },
    ];
}

function serializeSlots(slots: RoleSlotInput[]): string {
    return JSON.stringify(
        slots.map((slot) => ({
            roleName: slot.roleName,
            slotCount: Number(slot.slotCount),
            requiredSkills: slot.requiredSkills
                .split(",")
                .map((skill) => skill.trim())
                .filter((skill) => skill.length > 0),
        })),
    );
}

function updateSlotValue(
    slots: RoleSlotInput[],
    slotId: string,
    key: "roleName" | "slotCount" | "requiredSkills",
    value: string,
): RoleSlotInput[] {
    return slots.map((slot) => (slot.id === slotId ? { ...slot, [key]: value } : slot));
}

function removeSlot(slots: RoleSlotInput[], slotId: string): RoleSlotInput[] {
    if (slots.length <= 1) {
        return slots;
    }

    return slots.filter((slot) => slot.id !== slotId);
}

export default function EditBoardForm({ board }: { board: CompetitionIdeaBoardRecord }) {
    const initialCompetitionType = getSelectValue(board.competitionType);
    const [selectedCompetitionType, setSelectedCompetitionType] = useState<string>(initialCompetitionType);
    const [slots, setSlots] = useState<RoleSlotInput[]>(createInitialSlots(board));
    const [state, formAction, pending] = useActionState(updateCompetitionIdeaBoard, competitionIdeaBoardInitialState);

    const previewSkills = useMemo(
        () =>
            getSkillsValue(board.requiredSkills)
                .split(",")
                .map((skill) => skill.trim())
                .filter((skill) => skill.length > 0),
        [board.requiredSkills],
    );

    return (
        <form action={formAction} className="brutal-stack">
            <div className="brutal-panel grid gap-8 bg-[var(--tm-paper-strong)] p-6 md:p-8">
                <input type="hidden" name="id" value={board.id} />
                <input type="hidden" name="slots_json" value={serializeSlots(slots)} />
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

                    <div className="grid gap-4 md:col-span-2">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <label className="brutal-label">Daftar Peran</label>
                            <button
                                type="button"
                                className="brutal-button-secondary"
                                onClick={() =>
                                    setSlots((current) => [
                                        ...current,
                                        {
                                            id: crypto.randomUUID(),
                                            roleName: "",
                                            slotCount: "1",
                                            requiredSkills: "",
                                        },
                                    ])
                                }
                            >
                                Tambah Peran
                            </button>
                        </div>

                        {slots.map((slot, index) => (
                            <div key={slot.id} className="brutal-panel-soft grid gap-4 p-4 md:grid-cols-[1fr_180px_auto]">
                                <div className="grid gap-2">
                                    <label htmlFor={`slot-role-${slot.id}`} className="brutal-label">
                                        Peran {index + 1}
                                    </label>
                                    <input
                                        id={`slot-role-${slot.id}`}
                                        className="brutal-input"
                                        value={slot.roleName}
                                        placeholder="Contoh: Frontend Engineer"
                                        disabled={pending}
                                        onChange={(event) =>
                                            setSlots((current) =>
                                                updateSlotValue(current, slot.id, "roleName", event.target.value),
                                            )
                                        }
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <label htmlFor={`slot-count-${slot.id}`} className="brutal-label">
                                        Jumlah Slot
                                    </label>
                                    <input
                                        id={`slot-count-${slot.id}`}
                                        type="number"
                                        min={1}
                                        max={10}
                                        className="brutal-input"
                                        value={slot.slotCount}
                                        disabled={pending}
                                        onChange={(event) =>
                                            setSlots((current) =>
                                                updateSlotValue(current, slot.id, "slotCount", event.target.value),
                                            )
                                        }
                                    />
                                </div>

                                <div className="flex items-end">
                                    <button
                                        type="button"
                                        className="brutal-button-danger w-full"
                                        disabled={pending || slots.length <= 1}
                                        onClick={() => setSlots((current) => removeSlot(current, slot.id))}
                                    >
                                        Hapus
                                    </button>
                                </div>

                                <div className="col-span-full grid gap-2">
                                    <label htmlFor={`slot-skills-${slot.id}`} className="brutal-label">
                                        Skill yang Dibutuhkan untuk {slot.roleName || `Peran ${index + 1}`}
                                    </label>
                                    <input
                                        id={`slot-skills-${slot.id}`}
                                        className="brutal-input"
                                        value={slot.requiredSkills}
                                        placeholder="React, TypeScript, UI Design"
                                        disabled={pending}
                                        onChange={(event) =>
                                            setSlots((current) =>
                                                updateSlotValue(current, slot.id, "requiredSkills", event.target.value),
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        ))}

                        {firstError(state.fieldErrors, "slots_json") && (
                            <p className="text-sm font-semibold text-[var(--tm-danger)]">
                                {firstError(state.fieldErrors, "slots_json")}
                            </p>
                        )}
                    </div>
                </div>

                <div className="brutal-panel bg-[var(--tm-line)] p-5 text-[var(--tm-paper-strong)]">
                    <p className="display-font text-3xl leading-none">Preview Peran</p>
                    <div className="mt-5 grid gap-3">
                        {slots.map((slot) => (
                            <div key={slot.id} className="brutal-panel-soft p-4 text-[var(--tm-line)]">
                                <p className="display-font text-xl leading-none">{slot.roleName || "Peran baru"}</p>
                                <p className="mt-2 text-sm uppercase tracking-[0.16em] text-[var(--tm-muted)]">
                                    {slot.slotCount || "1"} slot
                                </p>
                                {slot.requiredSkills && (
                                    <div className="mt-3 flex flex-wrap gap-1">
                                        {slot.requiredSkills
                                            .split(",")
                                            .map((skill) => skill.trim())
                                            .filter((skill) => skill.length > 0)
                                            .map((skill) => (
                                                <span
                                                    key={`${slot.id}-${skill}`}
                                                    className="text-xs rounded bg-white px-2 py-1 text-[var(--tm-line)]"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                        {previewSkills.map((skill) => (
                            <span key={skill} className="brutal-chip bg-white text-[var(--tm-line)]">
                                {skill}
                            </span>
                        ))}
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
