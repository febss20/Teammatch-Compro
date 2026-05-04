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
        <form
            action={formAction}
            className="space-y-8 rounded-[2rem] border border-white/70 bg-white/92 p-8 shadow-[0_35px_120px_rgba(6,182,212,0.18)] backdrop-blur md:p-10"
        >
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" />

            <div className="space-y-3">
                <div className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-700">
                    Workspace Board
                </div>
                <h2 className="text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
                    Buat board ide yang siap ditindaklanjuti calon rekan tim.
                </h2>
                <p className="max-w-2xl text-base leading-7 text-gray-600">
                    Dashboard ini adalah ruang kerja awal Anda. Jelaskan ide secara ringkas, tentukan deadline, dan nyatakan
                    skill yang benar-benar dibutuhkan agar proses matching lebih presisi.
                </p>
            </div>

            {state.formError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                    {state.formError}
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                    <label htmlFor="title" className="text-sm font-semibold text-gray-800">
                        Judul Ide Lomba
                    </label>
                    <input
                        id="title"
                        name="title"
                        type="text"
                        required
                        disabled={pending}
                        placeholder="Contoh: Tim Hackathon AI untuk Solusi Edukasi Kampus"
                        className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-gray-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:bg-gray-100"
                    />
                    {getFieldError(state.fieldErrors, "title") && (
                        <p className="text-sm text-red-600">{getFieldError(state.fieldErrors, "title")}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="competition_type_select" className="text-sm font-semibold text-gray-800">
                        Jenis Lomba
                    </label>
                    <select
                        id="competition_type_select"
                        name="competition_type_select"
                        required
                        disabled={pending}
                        value={selectedCompetitionType}
                        onChange={(event) => setSelectedCompetitionType(event.target.value)}
                        className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-gray-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:bg-gray-100"
                    >
                        {competitionTypeOptions.map((option) => (
                            <option key={option} value={option}>
                                {competitionTypeLabels[option]}
                            </option>
                        ))}
                    </select>
                    {getFieldError(state.fieldErrors, "competition_type_select") && (
                        <p className="text-sm text-red-600">{getFieldError(state.fieldErrors, "competition_type_select")}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="deadline" className="text-sm font-semibold text-gray-800">
                        Deadline Lomba
                    </label>
                    <input
                        id="deadline"
                        name="deadline"
                        type="date"
                        required
                        disabled={pending}
                        className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-gray-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:bg-gray-100"
                    />
                    {getFieldError(state.fieldErrors, "deadline") && (
                        <p className="text-sm text-red-600">{getFieldError(state.fieldErrors, "deadline")}</p>
                    )}
                </div>

                {selectedCompetitionType === "other" && (
                    <div className="space-y-2 md:col-span-2">
                        <label htmlFor="competition_type_other" className="text-sm font-semibold text-gray-800">
                            Jenis Lomba Lainnya
                        </label>
                        <input
                            id="competition_type_other"
                            name="competition_type_other"
                            type="text"
                            required
                            disabled={pending}
                            placeholder="Contoh: Debat Kebijakan Publik"
                            className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-gray-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:bg-gray-100"
                        />
                        {getFieldError(state.fieldErrors, "competition_type_other") && (
                            <p className="text-sm text-red-600">{getFieldError(state.fieldErrors, "competition_type_other")}</p>
                        )}
                    </div>
                )}

                <div className="space-y-2 md:col-span-2">
                    <label htmlFor="description" className="text-sm font-semibold text-gray-800">
                        Deskripsi Ide
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        required
                        rows={6}
                        disabled={pending}
                        placeholder="Jelaskan masalah yang ingin diselesaikan, pendekatan solusi, target lomba, dan ekspektasi kolaborasi tim."
                        className="w-full rounded-3xl border border-gray-200 bg-white px-5 py-4 text-gray-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:bg-gray-100"
                    />
                    {getFieldError(state.fieldErrors, "description") && (
                        <p className="text-sm text-red-600">{getFieldError(state.fieldErrors, "description")}</p>
                    )}
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label htmlFor="required_skills" className="text-sm font-semibold text-gray-800">
                        Skill yang Dibutuhkan
                    </label>
                    <input
                        id="required_skills"
                        name="required_skills"
                        type="text"
                        required
                        disabled={pending}
                        placeholder="Contoh: UI/UX, Frontend React, Pitch Deck, Data Analysis"
                        className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-gray-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:bg-gray-100"
                    />
                    <p className="text-sm text-gray-500">Pisahkan dengan koma. Maksimal 10 skill.</p>
                    {getFieldError(state.fieldErrors, "required_skills") && (
                        <p className="text-sm text-red-600">{getFieldError(state.fieldErrors, "required_skills")}</p>
                    )}
                </div>
            </div>

            <div className="flex flex-col items-start gap-4 border-t border-gray-100 pt-6 md:flex-row md:items-center md:justify-between">
                <p className="max-w-xl text-sm leading-6 text-gray-500">
                    Board yang jelas akan mempercepat Anda menemukan kolaborator yang tepat dan mengurangi mismatch ekspektasi.
                </p>
                <button
                    type="submit"
                    disabled={pending}
                    className="inline-flex min-w-[170px] items-center justify-center rounded-full bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {pending ? "Menyimpan Board..." : "Simpan Board"}
                </button>
            </div>
        </form>
    );
}
