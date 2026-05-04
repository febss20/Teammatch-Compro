"use client";

import { useActionState, useState } from "react";
import { createCompetitionIdeaBoard } from "@/app/(dashboard)/dashboard/actions";
import { competitionIdeaBoardInitialState } from "@/lib/forms";
import { competitionTypeOptions } from "@/lib/types";

const competitionTypeLabels: Record<(typeof competitionTypeOptions)[number], string> = {
    hackathon: "Hackathon",
    business_plan: "Business Plan",
    ui_ux_design: "UI/UX Design",
    data_science: "Data Science",
    karya_tulis: "Karya Tulis",
    startup_pitch: "Startup Pitch",
    other: "Lainnya",
};

function getFieldError(fieldErrors: Partial<Record<string, string[]>>, fieldName: string): string | null {
    const errors = fieldErrors[fieldName];

    if (!errors || errors.length === 0) {
        return null;
    }

    return errors[0] ?? null;
}

export default function CreateBoardForm() {
    const [selectedCompetitionType, setSelectedCompetitionType] = useState<string>("hackathon");
    const [state, formAction, pending] = useActionState(createCompetitionIdeaBoard, competitionIdeaBoardInitialState);

    return (
        <form action={formAction} className="brutal-stack">
            <div className="brutal-panel grid gap-8 bg-[var(--tm-paper-strong)] p-6 md:p-8">
                <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" />

                <div className="space-y-4">
                    <div className="section-kicker w-fit">Workspace Board</div>
                    <h2 className="display-font text-5xl leading-[0.9] md:text-6xl">BANGUN BOARD YANG TERASA SIAP KERJA</h2>
                    <p className="max-w-3xl text-base leading-8 text-[var(--tm-muted)]">
                        Jelaskan ide secara ringkas, tetapkan deadline, dan nyatakan skill yang benar-benar dibutuhkan agar
                        proses matching lebih presisi sejak awal.
                    </p>
                </div>

                {state.formError && <div className="brutal-alert-error text-sm">{state.formError}</div>}

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="grid gap-2 md:col-span-2">
                        <label htmlFor="title" className="brutal-label">
                            Judul Ide Lomba
                        </label>
                        <input
                            id="title"
                            name="title"
                            type="text"
                            required
                            disabled={pending}
                            placeholder="Contoh: Tim Hackathon AI untuk Solusi Edukasi Kampus"
                            className="brutal-input"
                        />
                        {getFieldError(state.fieldErrors, "title") && (
                            <p className="text-sm font-semibold text-[var(--tm-danger)]">{getFieldError(state.fieldErrors, "title")}</p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <label htmlFor="competition_type_select" className="brutal-label">
                            Jenis Lomba
                        </label>
                        <select
                            id="competition_type_select"
                            name="competition_type_select"
                            required
                            disabled={pending}
                            value={selectedCompetitionType}
                            onChange={(event) => setSelectedCompetitionType(event.target.value)}
                            className="brutal-select"
                        >
                            {competitionTypeOptions.map((option) => (
                                <option key={option} value={option}>
                                    {competitionTypeLabels[option]}
                                </option>
                            ))}
                        </select>
                        {getFieldError(state.fieldErrors, "competition_type_select") && (
                            <p className="text-sm font-semibold text-[var(--tm-danger)]">
                                {getFieldError(state.fieldErrors, "competition_type_select")}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <label htmlFor="deadline" className="brutal-label">
                            Deadline Lomba
                        </label>
                        <input id="deadline" name="deadline" type="date" required disabled={pending} className="brutal-input" />
                        {getFieldError(state.fieldErrors, "deadline") && (
                            <p className="text-sm font-semibold text-[var(--tm-danger)]">
                                {getFieldError(state.fieldErrors, "deadline")}
                            </p>
                        )}
                    </div>

                    {selectedCompetitionType === "other" && (
                        <div className="grid gap-2 md:col-span-2">
                            <label htmlFor="competition_type_other" className="brutal-label">
                                Jenis Lomba Lainnya
                            </label>
                            <input
                                id="competition_type_other"
                                name="competition_type_other"
                                type="text"
                                required
                                disabled={pending}
                                placeholder="Contoh: Debat Kebijakan Publik"
                                className="brutal-input"
                            />
                            {getFieldError(state.fieldErrors, "competition_type_other") && (
                                <p className="text-sm font-semibold text-[var(--tm-danger)]">
                                    {getFieldError(state.fieldErrors, "competition_type_other")}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="grid gap-2 md:col-span-2">
                        <label htmlFor="description" className="brutal-label">
                            Deskripsi Ide
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            required
                            rows={6}
                            disabled={pending}
                            placeholder="Jelaskan masalah yang ingin diselesaikan, pendekatan solusi, target lomba, dan ekspektasi kolaborasi tim."
                            className="brutal-textarea"
                        />
                        {getFieldError(state.fieldErrors, "description") && (
                            <p className="text-sm font-semibold text-[var(--tm-danger)]">
                                {getFieldError(state.fieldErrors, "description")}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-2 md:col-span-2">
                        <label htmlFor="required_skills" className="brutal-label">
                            Skill yang Dibutuhkan
                        </label>
                        <input
                            id="required_skills"
                            name="required_skills"
                            type="text"
                            required
                            disabled={pending}
                            placeholder="Contoh: UI/UX, Frontend React, Pitch Deck, Data Analysis"
                            className="brutal-input"
                        />
                        <p className="text-sm leading-7 text-[var(--tm-muted)]">Pisahkan dengan koma. Maksimal 10 skill.</p>
                        {getFieldError(state.fieldErrors, "required_skills") && (
                            <p className="text-sm font-semibold text-[var(--tm-danger)]">
                                {getFieldError(state.fieldErrors, "required_skills")}
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 border-t-[3px] border-dashed border-[var(--tm-line)] pt-6 md:grid-cols-[1fr_auto] md:items-center">
                    <p className="max-w-xl text-sm leading-7 text-[var(--tm-muted)]">
                        Board yang jelas akan mempercepat Anda menemukan kolaborator yang tepat dan mengurangi mismatch
                        ekspektasi.
                    </p>
                    <button type="submit" disabled={pending} className="brutal-button min-w-[220px]">
                        {pending ? "Menyimpan Board..." : "Simpan Board"}
                    </button>
                </div>
            </div>
        </form>
    );
}
