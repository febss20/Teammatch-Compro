"use client";

import { useActionState, useState } from "react";
import { updateCompetitionIdeaBoard } from "@/app/(dashboard)/dashboard/actions";
import { competitionIdeaBoardInitialState } from "@/lib/forms";
import { competitionIdeaBoardStatusOptions, competitionTypeOptions, type CompetitionIdeaBoardRecord } from "@/lib/types";

const competitionTypeLabels: Record<(typeof competitionTypeOptions)[number], string> = {
    hackathon: "Hackathon",
    business_plan: "Business Plan",
    ui_ux_design: "UI/UX Design",
    data_science: "Data Science",
    karya_tulis: "Karya Tulis",
    startup_pitch: "Startup Pitch",
    other: "Lainnya",
};

const statusLabels: Record<(typeof competitionIdeaBoardStatusOptions)[number], string> = {
    open: "Open",
    closed: "Closed",
};

interface EditBoardFormProps {
    board: CompetitionIdeaBoardRecord;
}

function getFieldError(fieldErrors: Partial<Record<string, string[]>>, fieldName: string): string | null {
    const errors = fieldErrors[fieldName];

    if (!errors || errors.length === 0) {
        return null;
    }

    return errors[0] ?? null;
}

function getSelectValue(competitionType: string): string {
    return competitionTypeOptions.includes(competitionType as (typeof competitionTypeOptions)[number])
        ? competitionType
        : "other";
}

function getOtherValue(competitionType: string): string {
    return getSelectValue(competitionType) === "other" ? competitionType : "";
}

function getDateValue(deadline: string): string {
    return deadline.slice(0, 10);
}

function getSkillsValue(requiredSkills: string[]): string {
    return requiredSkills.join(", ");
}

export default function EditBoardForm({ board }: EditBoardFormProps) {
    const initialCompetitionType = getSelectValue(board.competitionType);
    const [selectedCompetitionType, setSelectedCompetitionType] = useState<string>(initialCompetitionType);
    const [state, formAction, pending] = useActionState(updateCompetitionIdeaBoard, competitionIdeaBoardInitialState);

    return (
        <form action={formAction} className="brutal-stack">
            <div className="brutal-panel grid gap-8 bg-[var(--tm-paper-strong)] p-6 md:p-8">
                <input type="hidden" name="id" value={board.id} />
                <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" />

                <div className="space-y-4">
                    <div className="section-kicker w-fit">Edit Board</div>
                    <h2 className="display-font text-5xl leading-[0.9] md:text-6xl">PERBARUI BOARD AGAR TETAP RELEVAN</h2>
                    <p className="max-w-3xl text-base leading-8 text-[var(--tm-muted)]">
                        Gunakan halaman ini untuk memperjelas ide, mengganti status board, atau menyesuaikan kebutuhan skill
                        sesuai progres kompetisi Anda.
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
                            defaultValue={board.title}
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
                        <label htmlFor="status" className="brutal-label">
                            Status Board
                        </label>
                        <select
                            id="status"
                            name="status"
                            required
                            disabled={pending}
                            defaultValue={board.status}
                            className="brutal-select"
                        >
                            {competitionIdeaBoardStatusOptions.map((status) => (
                                <option key={status} value={status}>
                                    {statusLabels[status]}
                                </option>
                            ))}
                        </select>
                        {getFieldError(state.fieldErrors, "status") && (
                            <p className="text-sm font-semibold text-[var(--tm-danger)]">{getFieldError(state.fieldErrors, "status")}</p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <label htmlFor="deadline" className="brutal-label">
                            Deadline Lomba
                        </label>
                        <input
                            id="deadline"
                            name="deadline"
                            type="date"
                            required
                            disabled={pending}
                            defaultValue={getDateValue(board.deadline)}
                            className="brutal-input"
                        />
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
                                defaultValue={getOtherValue(board.competitionType)}
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
                            defaultValue={board.description}
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
                            defaultValue={getSkillsValue(board.requiredSkills)}
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
                        Gunakan status open atau closed untuk memberi sinyal jelas apakah board masih menerima kolaborator
                        baru.
                    </p>
                    <button type="submit" disabled={pending} className="brutal-button min-w-[240px]">
                        {pending ? "Menyimpan Perubahan..." : "Simpan Perubahan"}
                    </button>
                </div>
            </div>
        </form>
    );
}
