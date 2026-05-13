"use client";

import { startTransition, useActionState, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { discardBoardDraft, publishBoardFromDraft, saveBoardDraft } from "@/app/(dashboard)/dashboard/actions";
import { competitionIdeaBoardInitialState } from "@/lib/forms";
import { boardRoleOptions, competitionTypeOptions, type BoardDraftRecord, type CompetitionTypeRecord } from "@/lib/types";
import { boardVisibilityLabels, competitionTypeLabels } from "@/lib/platform";

interface CreateBoardFormProps {
    competitionTypes: CompetitionTypeRecord[];
    draft: BoardDraftRecord | null;
}

interface RoleSlotInput {
    id: string;
    roleName: string;
    slotCount: string;
    requiredSkills: string;
}

interface BoardComposerState {
    competitionTypeOther: string;
    deadline: string;
    description: string;
    requiredSkills: string;
    selectedCompetitionType: string;
    slots: RoleSlotInput[];
    summary: string;
    title: string;
    visibility: "public" | "private";
}

function firstError(fieldErrors: Partial<Record<string, string[]>>, fieldName: string): string | null {
    return fieldErrors[fieldName]?.[0] ?? null;
}

function createSlotId(): string {
    return crypto.randomUUID();
}

function resolveInitialCompetitionType(competitionType: string | null): string {
    if (!competitionType) {
        return "hackathon";
    }

    if (competitionTypeOptions.includes(competitionType as (typeof competitionTypeOptions)[number])) {
        return competitionType;
    }

    return "others";
}

function toDateInputValue(deadline: string | null): string {
    if (!deadline) {
        return "";
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
        return deadline;
    }

    return new Date(deadline).toISOString().slice(0, 10);
}

function createEmptySlot(roleName: string): RoleSlotInput {
    return {
        id: createSlotId(),
        roleName,
        slotCount: "1",
        requiredSkills: "",
    };
}

function createInitialSlots(draft: BoardDraftRecord | null): RoleSlotInput[] {
    if (draft && draft.slots.length > 0) {
        return draft.slots.map((slot) => ({
            id: createSlotId(),
            roleName: slot.roleName,
            slotCount: String(slot.slotCount),
            requiredSkills: (slot.requiredSkills ?? []).join(", "),
        }));
    }

    return [createEmptySlot(boardRoleOptions[0])];
}

function createInitialComposerState(draft: BoardDraftRecord | null): BoardComposerState {
    const selectedCompetitionType = resolveInitialCompetitionType(draft?.competitionType ?? null);

    return {
        competitionTypeOther: selectedCompetitionType === "others" ? (draft?.competitionType ?? "") : "",
        deadline: toDateInputValue(draft?.deadline ?? null),
        description: draft?.description ?? "",
        requiredSkills: draft?.requiredSkills?.join(", ") ?? "",
        selectedCompetitionType,
        slots: createInitialSlots(draft),
        summary: draft?.summary ?? "",
        title: draft?.title ?? "",
        visibility: draft?.visibility ?? "public",
    };
}

function createEmptyComposerState(): BoardComposerState {
    return createInitialComposerState(null);
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

function buildComposerFormData(state: BoardComposerState): FormData {
    const formData = new FormData();
    formData.set("title", state.title);
    formData.set("summary", state.summary);
    formData.set("competition_type_select", state.selectedCompetitionType);
    formData.set("competition_type_other", state.competitionTypeOther);
    formData.set("description", state.description);
    formData.set("deadline", state.deadline);
    formData.set("required_skills", state.requiredSkills);
    formData.set("visibility", state.visibility);
    formData.set("slots_json", serializeSlots(state.slots));
    formData.set("website", "");
    return formData;
}

function createSuggestedSkills(
    competitionTypes: CompetitionTypeRecord[],
    selectedCompetitionType: string,
    requiredSkills: string,
): string[] {
    const selectedCompetitionRecord =
        competitionTypes.find((competitionType) => competitionType.slug === selectedCompetitionType) ?? null;
    if (!selectedCompetitionRecord) {
        return [];
    }

    const currentSkills = new Set(
        requiredSkills
            .split(",")
            .map((skill) => skill.trim().toLowerCase())
            .filter((skill) => skill.length > 0),
    );

    return selectedCompetitionRecord.recommendedSkills.filter((skill) => !currentSkills.has(skill.trim().toLowerCase()));
}

function appendSuggestedSkill(requiredSkills: string, suggestedSkill: string): string {
    if (requiredSkills.trim().length === 0) {
        return suggestedSkill;
    }

    return `${requiredSkills}, ${suggestedSkill}`;
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

export default function CreateBoardForm({ competitionTypes, draft }: CreateBoardFormProps) {
    const [step, setStep] = useState<number>(1);
    const [composerState, setComposerState] = useState<BoardComposerState>(createInitialComposerState(draft));
    const [draftFeedback, setDraftFeedback] = useState<string>(draft ? "Draft sebelumnya dipulihkan." : "Mulai board baru.");
    const lastAutosavedSnapshotRef = useRef<string>(JSON.stringify(createInitialComposerState(draft)));
    const [state, formAction, pending] = useActionState(publishBoardFromDraft, competitionIdeaBoardInitialState);

    const previewSkills = useMemo(
        () =>
            composerState.requiredSkills
                .split(",")
                .map((skill) => skill.trim())
                .filter((skill) => skill.length > 0),
        [composerState.requiredSkills],
    );

    useEffect(() => {
        const nextSnapshot = JSON.stringify(composerState);
        if (nextSnapshot === lastAutosavedSnapshotRef.current) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            startTransition(async () => {
                try {
                    await saveBoardDraft(buildComposerFormData(composerState));
                    lastAutosavedSnapshotRef.current = JSON.stringify(composerState);
                    setDraftFeedback("Draft tersimpan otomatis.");
                } catch (error) {
                    setDraftFeedback(error instanceof Error ? error.message : "Draft gagal disimpan.");
                }
            });
        }, 650);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [composerState]);

    function handleSubmit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        const formData = buildComposerFormData(composerState);
        startTransition(() => {
            void formAction(formData);
        });
    }

    return (
        <form onSubmit={handleSubmit} className="brutal-stack">
            <div className="brutal-panel grid gap-8 bg-[var(--tm-paper-strong)] p-6 md:p-8">
                <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" />
                <input type="hidden" name="slots_json" value={serializeSlots(composerState.slots)} />

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-3">
                        {[1, 2].map((stepIndex) => (
                            <button
                                key={stepIndex}
                                type="button"
                                onClick={() => setStep(stepIndex)}
                                className={`brutal-chip px-4 py-3 text-base ${step === stepIndex ? "bg-[var(--tm-accent)]" : "bg-white"}`}
                            >
                                Step {stepIndex}
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <span className="brutal-chip bg-white text-sm">{draftFeedback}</span>
                        <button
                            type="button"
                            className="brutal-button-secondary"
                            disabled={pending}
                            onClick={() => {
                                startTransition(async () => {
                                    await discardBoardDraft();
                                    const emptyState = createEmptyComposerState();
                                    setComposerState(emptyState);
                                    lastAutosavedSnapshotRef.current = JSON.stringify(emptyState);
                                    setDraftFeedback("Draft dibuang. Anda sedang memulai board baru.");
                                    setStep(1);
                                });
                            }}
                        >
                            Buang draft
                        </button>
                    </div>
                </div>

                {state.formError && <div className="brutal-alert-error text-sm">{state.formError}</div>}

                {step === 1 && (
                    <div className="grid gap-6">
                        <div className="space-y-4">
                            <div className="section-kicker w-fit">Step 1 / Info ide</div>
                            <h2 className="display-font text-5xl leading-[0.9] md:text-6xl">TULIS INTI IDE DENGAN RINGKAS</h2>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="grid gap-2 md:col-span-2">
                                <label htmlFor="title" className="brutal-label">
                                    Judul Ide
                                </label>
                                <input
                                    id="title"
                                    name="title"
                                    required
                                    value={composerState.title}
                                    className="brutal-input"
                                    disabled={pending}
                                    onChange={(event) =>
                                        setComposerState((current) => ({ ...current, title: event.target.value }))
                                    }
                                />
                                {firstError(state.fieldErrors, "title") && (
                                    <p className="text-sm font-semibold text-[var(--tm-danger)]">
                                        {firstError(state.fieldErrors, "title")}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2 md:col-span-2">
                                <label htmlFor="summary" className="brutal-label">
                                    Ringkasan Singkat
                                </label>
                                <textarea
                                    id="summary"
                                    name="summary"
                                    rows={3}
                                    required
                                    value={composerState.summary}
                                    className="brutal-textarea"
                                    disabled={pending}
                                    onChange={(event) =>
                                        setComposerState((current) => ({ ...current, summary: event.target.value }))
                                    }
                                />
                                {firstError(state.fieldErrors, "summary") && (
                                    <p className="text-sm font-semibold text-[var(--tm-danger)]">
                                        {firstError(state.fieldErrors, "summary")}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <label htmlFor="competition_type_select" className="brutal-label">
                                    Jenis Lomba
                                </label>
                                <select
                                    id="competition_type_select"
                                    name="competition_type_select"
                                    className="brutal-select"
                                    value={composerState.selectedCompetitionType}
                                    disabled={pending}
                                    onChange={(event) =>
                                        setComposerState((current) => ({
                                            ...current,
                                            selectedCompetitionType: event.target.value,
                                            competitionTypeOther:
                                                event.target.value === "others" ? current.competitionTypeOther : "",
                                        }))
                                    }
                                >
                                    {competitionTypeOptions.map((option) => (
                                        <option key={option} value={option}>
                                            {competitionTypeLabels[option]}
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
                                    value={composerState.deadline}
                                    disabled={pending}
                                    required
                                    onChange={(event) =>
                                        setComposerState((current) => ({ ...current, deadline: event.target.value }))
                                    }
                                />
                                {firstError(state.fieldErrors, "deadline") && (
                                    <p className="text-sm font-semibold text-[var(--tm-danger)]">
                                        {firstError(state.fieldErrors, "deadline")}
                                    </p>
                                )}
                            </div>

                            {composerState.selectedCompetitionType === "others" && (
                                <div className="grid gap-2 md:col-span-2">
                                    <label htmlFor="competition_type_other" className="brutal-label">
                                        Jenis Lomba Lainnya
                                    </label>
                                    <input
                                        id="competition_type_other"
                                        name="competition_type_other"
                                        className="brutal-input"
                                        value={composerState.competitionTypeOther}
                                        disabled={pending}
                                        onChange={(event) =>
                                            setComposerState((current) => ({
                                                ...current,
                                                competitionTypeOther: event.target.value,
                                            }))
                                        }
                                    />
                                    {firstError(state.fieldErrors, "competition_type_other") && (
                                        <p className="text-sm font-semibold text-[var(--tm-danger)]">
                                            {firstError(state.fieldErrors, "competition_type_other")}
                                        </p>
                                    )}
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
                                    value={composerState.description}
                                    disabled={pending}
                                    required
                                    onChange={(event) =>
                                        setComposerState((current) => ({ ...current, description: event.target.value }))
                                    }
                                />
                                {firstError(state.fieldErrors, "description") && (
                                    <p className="text-sm font-semibold text-[var(--tm-danger)]">
                                        {firstError(state.fieldErrors, "description")}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button type="button" onClick={() => setStep(2)} className="brutal-button">
                                Lanjut ke kebutuhan tim
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
                        <div className="grid gap-6">
                            <div className="space-y-4">
                                <div className="section-kicker w-fit">Step 2 / Kebutuhan tim</div>
                                <h2 className="display-font text-5xl leading-[0.9] md:text-6xl">
                                    TETAPKAN SLOT DAN SKILL YANG DIBUTUHKAN
                                </h2>
                            </div>

                            <div className="grid gap-6">
                                <div className="grid gap-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <label className="brutal-label">Daftar Peran</label>
                                        <button
                                            type="button"
                                            className="brutal-button-secondary"
                                            onClick={() =>
                                                setComposerState((current) => ({
                                                    ...current,
                                                    slots: [...current.slots, createEmptySlot("")],
                                                }))
                                            }
                                        >
                                            Tambah Peran
                                        </button>
                                    </div>

                                    {composerState.slots.map((slot, index) => (
                                        <div
                                            key={slot.id}
                                            className="brutal-panel-soft grid gap-4 p-4 md:grid-cols-[1fr_180px_auto]"
                                        >
                                            <div className="grid gap-2">
                                                <label htmlFor={`slot-role-${slot.id}`} className="brutal-label">
                                                    Peran {index + 1}
                                                </label>
                                                <input
                                                    id={`slot-role-${slot.id}`}
                                                    className="brutal-input"
                                                    value={slot.roleName}
                                                    placeholder={boardRoleOptions[index] ?? "Contoh: Research Lead"}
                                                    disabled={pending}
                                                    onChange={(event) =>
                                                        setComposerState((current) => ({
                                                            ...current,
                                                            slots: updateSlotValue(
                                                                current.slots,
                                                                slot.id,
                                                                "roleName",
                                                                event.target.value,
                                                            ),
                                                        }))
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
                                                        setComposerState((current) => ({
                                                            ...current,
                                                            slots: updateSlotValue(
                                                                current.slots,
                                                                slot.id,
                                                                "slotCount",
                                                                event.target.value,
                                                            ),
                                                        }))
                                                    }
                                                />
                                            </div>

                                            <div className="flex items-end">
                                                <button
                                                    type="button"
                                                    className="brutal-button-danger w-full"
                                                    disabled={pending || composerState.slots.length <= 1}
                                                    onClick={() =>
                                                        setComposerState((current) => ({
                                                            ...current,
                                                            slots: removeSlot(current.slots, slot.id),
                                                        }))
                                                    }
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
                                                    disabled={pending}
                                                    placeholder="React, TypeScript, UI Design"
                                                    value={slot.requiredSkills}
                                                    onChange={(event) =>
                                                        setComposerState((current) => ({
                                                            ...current,
                                                            slots: updateSlotValue(
                                                                current.slots,
                                                                slot.id,
                                                                "requiredSkills",
                                                                event.target.value,
                                                            ),
                                                        }))
                                                    }
                                                />
                                                {createSuggestedSkills(
                                                    competitionTypes,
                                                    composerState.selectedCompetitionType,
                                                    slot.requiredSkills,
                                                ).length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {createSuggestedSkills(
                                                            competitionTypes,
                                                            composerState.selectedCompetitionType,
                                                            slot.requiredSkills,
                                                        ).map((skill) => (
                                                            <button
                                                                key={`${slot.id}-${skill}`}
                                                                type="button"
                                                                className="brutal-chip bg-white"
                                                                onClick={() =>
                                                                    setComposerState((current) => ({
                                                                        ...current,
                                                                        slots: updateSlotValue(
                                                                            current.slots,
                                                                            slot.id,
                                                                            "requiredSkills",
                                                                            appendSuggestedSkill(slot.requiredSkills, skill),
                                                                        ),
                                                                    }))
                                                                }
                                                            >
                                                                + {skill}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {firstError(state.fieldErrors, "slots_json") && (
                                        <p className="text-sm font-semibold text-[var(--tm-danger)]">
                                            {firstError(state.fieldErrors, "slots_json")}
                                        </p>
                                    )}
                                    {firstError(state.fieldErrors, "required_skills") && (
                                        <p className="text-sm font-semibold text-[var(--tm-danger)]">
                                            {firstError(state.fieldErrors, "required_skills")}
                                        </p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <label htmlFor="visibility" className="brutal-label">
                                        Visibilitas Board
                                    </label>
                                    <select
                                        id="visibility"
                                        name="visibility"
                                        className="brutal-select"
                                        value={composerState.visibility}
                                        disabled={pending}
                                        onChange={(event) =>
                                            setComposerState((current) => ({
                                                ...current,
                                                visibility: event.target.value === "private" ? "private" : "public",
                                            }))
                                        }
                                    >
                                        <option value="public">Publik</option>
                                        <option value="private">Privat</option>
                                    </select>
                                    {firstError(state.fieldErrors, "visibility") && (
                                        <p className="text-sm font-semibold text-[var(--tm-danger)]">
                                            {firstError(state.fieldErrors, "visibility")}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap justify-between gap-3">
                                <button type="button" onClick={() => setStep(1)} className="brutal-button-secondary">
                                    Kembali
                                </button>
                                <button type="submit" disabled={pending} className="brutal-button min-w-[220px]">
                                    {pending ? "Mempublikasikan..." : "Publish board"}
                                </button>
                            </div>
                        </div>

                        <aside className="brutal-panel bg-[var(--tm-line)] p-5 text-[var(--tm-paper-strong)]">
                            <p className="display-font text-3xl leading-none">Preview</p>
                            <h3 className="mt-4 display-font text-4xl leading-[0.92]">
                                {composerState.title || "Judul board Anda"}
                            </h3>
                            <p className="mt-3 text-sm leading-7 text-[#f7eeda]">
                                {composerState.summary || "Ringkasan board akan muncul di sini."}
                            </p>
                            <p className="mt-4 text-sm uppercase tracking-[0.18em] text-[#f7eeda]">
                                {boardVisibilityLabels[composerState.visibility]}
                            </p>
                            <div className="mt-5 flex flex-wrap gap-2">
                                {previewSkills.length > 0 ? (
                                    previewSkills.map((skill) => (
                                        <span key={skill} className="brutal-chip bg-white text-[var(--tm-line)]">
                                            {skill}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-sm text-[#f7eeda]">Skill akan tampil di sini.</span>
                                )}
                            </div>
                            <div className="mt-5 grid gap-3">
                                {composerState.slots.map((slot) => (
                                    <div key={slot.id} className="brutal-panel-soft p-4 text-[var(--tm-line)]">
                                        <p className="display-font text-xl leading-none">{slot.roleName || "Peran baru"}</p>
                                        <p className="mt-2 text-sm uppercase tracking-[0.16em] text-[var(--tm-muted)]">
                                            {slot.slotCount || "1"} slot
                                        </p>
                                        {slot.requiredSkills && (
                                            <div className="mt-3 flex flex-wrap gap-1">
                                                {slot.requiredSkills
                                                    .split(",")
                                                    .map((s) => s.trim())
                                                    .filter((s) => s)
                                                    .map((skill) => (
                                                        <span
                                                            key={skill}
                                                            className="text-xs bg-white px-2 py-1 rounded text-[var(--tm-line)]"
                                                        >
                                                            {skill}
                                                        </span>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </aside>
                    </div>
                )}
            </div>
        </form>
    );
}
