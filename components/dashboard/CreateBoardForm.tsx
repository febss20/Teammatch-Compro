"use client";

import { useActionState, useMemo, useState } from "react";
import { createCompetitionIdeaBoard } from "@/app/(dashboard)/dashboard/actions";
import { competitionIdeaBoardInitialState } from "@/lib/forms";
import { boardRoleOptions, boardVisibilityOptions, competitionTypeOptions } from "@/lib/types";
import { boardVisibilityLabels, competitionTypeLabels } from "@/lib/platform";

function firstError(fieldErrors: Partial<Record<string, string[]>>, fieldName: string): string | null {
    return fieldErrors[fieldName]?.[0] ?? null;
}

export default function CreateBoardForm() {
    const [step, setStep] = useState(1);
    const [selectedCompetitionType, setSelectedCompetitionType] = useState<string>("hackathon");
    const [preview, setPreview] = useState<{
        title: string;
        summary: string;
        description: string;
        requiredSkills: string;
        roleOne: string;
        roleTwo: string;
        visibility: string;
    }>({
        title: "",
        summary: "",
        description: "",
        requiredSkills: "",
        roleOne: boardRoleOptions[0],
        roleTwo: "",
        visibility: "public",
    });
    const [state, formAction, pending] = useActionState(createCompetitionIdeaBoard, competitionIdeaBoardInitialState);

    const previewSkills = useMemo(
        () =>
            preview.requiredSkills
                .split(",")
                .map((skill) => skill.trim())
                .filter(Boolean),
        [preview.requiredSkills],
    );

    return (
        <form action={formAction} className="brutal-stack">
            <div className="brutal-panel grid gap-8 bg-[var(--tm-paper-strong)] p-6 md:p-8">
                <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" />

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
                                    className="brutal-input"
                                    disabled={pending}
                                    onChange={(event) => setPreview((current) => ({ ...current, title: event.target.value }))}
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
                                    className="brutal-textarea"
                                    disabled={pending}
                                    onChange={(event) => setPreview((current) => ({ ...current, summary: event.target.value }))}
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
                                <label htmlFor="deadline" className="brutal-label">
                                    Deadline
                                </label>
                                <input
                                    id="deadline"
                                    name="deadline"
                                    type="date"
                                    className="brutal-input"
                                    disabled={pending}
                                    required
                                />
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
                                    disabled={pending}
                                    required
                                    onChange={(event) =>
                                        setPreview((current) => ({ ...current, description: event.target.value }))
                                    }
                                />
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
                                <div className="grid gap-2">
                                    <label htmlFor="required_skills" className="brutal-label">
                                        Skill yang Dibutuhkan
                                    </label>
                                    <input
                                        id="required_skills"
                                        name="required_skills"
                                        className="brutal-input"
                                        disabled={pending}
                                        placeholder="UI/UX, Frontend React, Pitch Deck"
                                        onChange={(event) =>
                                            setPreview((current) => ({ ...current, requiredSkills: event.target.value }))
                                        }
                                    />
                                </div>

                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <label htmlFor="slot_role_1" className="brutal-label">
                                            Peran Utama
                                        </label>
                                        <select
                                            id="slot_role_1"
                                            name="slot_role_1"
                                            className="brutal-select"
                                            defaultValue={boardRoleOptions[0]}
                                            disabled={pending}
                                            onChange={(event) =>
                                                setPreview((current) => ({ ...current, roleOne: event.target.value }))
                                            }
                                        >
                                            {boardRoleOptions.map((role) => (
                                                <option key={role} value={role}>
                                                    {role}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid gap-2">
                                        <label htmlFor="slot_count_1" className="brutal-label">
                                            Jumlah Slot
                                        </label>
                                        <input
                                            id="slot_count_1"
                                            name="slot_count_1"
                                            type="number"
                                            min={1}
                                            max={10}
                                            defaultValue={1}
                                            className="brutal-input"
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
                                            placeholder="Opsional"
                                            disabled={pending}
                                            onChange={(event) =>
                                                setPreview((current) => ({ ...current, roleTwo: event.target.value }))
                                            }
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
                                            defaultValue={1}
                                            className="brutal-input"
                                            disabled={pending}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <label htmlFor="visibility" className="brutal-label">
                                        Visibilitas Board
                                    </label>
                                    <select
                                        id="visibility"
                                        name="visibility"
                                        className="brutal-select"
                                        defaultValue="public"
                                        disabled={pending}
                                        onChange={(event) =>
                                            setPreview((current) => ({ ...current, visibility: event.target.value }))
                                        }
                                    >
                                        {boardVisibilityOptions.map((visibility) => (
                                            <option key={visibility} value={visibility}>
                                                {boardVisibilityLabels[visibility]}
                                            </option>
                                        ))}
                                    </select>
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
                            <h3 className="mt-4 display-font text-4xl leading-[0.92]">{preview.title || "Judul board Anda"}</h3>
                            <p className="mt-3 text-sm leading-7 text-[#f7eeda]">
                                {preview.summary || "Ringkasan board akan muncul di sini."}
                            </p>
                            <p className="mt-4 text-sm uppercase tracking-[0.18em] text-[#f7eeda]">
                                {boardVisibilityLabels[preview.visibility as keyof typeof boardVisibilityLabels]}
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
                                <div className="brutal-panel-soft p-4 text-[var(--tm-line)]">
                                    <p className="display-font text-xl leading-none">{preview.roleOne}</p>
                                </div>
                                {preview.roleTwo.trim().length > 0 && (
                                    <div className="brutal-panel-soft p-4 text-[var(--tm-line)]">
                                        <p className="display-font text-xl leading-none">{preview.roleTwo}</p>
                                    </div>
                                )}
                            </div>
                        </aside>
                    </div>
                )}
            </div>
        </form>
    );
}
