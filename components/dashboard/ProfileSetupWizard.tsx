"use client";

import { useActionState, useState } from "react";
import { completeProfileStepOne, completeProfileStepThree, completeProfileStepTwo } from "@/app/(dashboard)/dashboard/actions";
import { profileStepOneInitialState, profileStepThreeInitialState, profileStepTwoInitialState } from "@/lib/forms";
import { dashboardMonthLabels } from "@/lib/platform";
import type { CompetitionTypeRecord, DashboardMonth, ProfileRecord, SkillOption } from "@/lib/types";

interface ProfileSetupWizardProps {
    competitionTypes: CompetitionTypeRecord[];
    profile: ProfileRecord | null;
    skills: SkillOption[];
}

function firstError(fieldErrors: Partial<Record<string, string[]>>, fieldName: string) {
    return fieldErrors[fieldName]?.[0] ?? null;
}

export default function ProfileSetupWizard({ competitionTypes, profile, skills }: ProfileSetupWizardProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [stepOneState, stepOneAction, stepOnePending] = useActionState(completeProfileStepOne, profileStepOneInitialState);
    const [stepTwoState, stepTwoAction, stepTwoPending] = useActionState(completeProfileStepTwo, profileStepTwoInitialState);
    const [stepThreeState, stepThreeAction, stepThreePending] = useActionState(
        completeProfileStepThree,
        profileStepThreeInitialState,
    );

    const selectedSkillIds = new Set(profile?.skills.map((skill) => skill.id) ?? []);
    const selectedCompetitionTypeIds = new Set(profile?.competitionTypes.map((type) => type.id) ?? []);
    const selectedMonths = new Set(profile?.availableMonths ?? []);

    return (
        <div className="brutal-stack">
            <div className="brutal-panel grid gap-8 bg-[var(--tm-paper-strong)] p-6 md:p-8">
                <div className="flex flex-wrap gap-3">
                    {[1, 2, 3].map((step) => (
                        <button
                            key={step}
                            type="button"
                            onClick={() => setCurrentStep(step)}
                            className={`brutal-chip px-4 py-3 text-base ${currentStep === step ? "bg-[var(--tm-accent-2)]" : "bg-white"}`}
                        >
                            Step {step}
                        </button>
                    ))}
                </div>

                {currentStep === 1 && (
                    <form action={stepOneAction} className="grid gap-6">
                        <div className="space-y-3">
                            <div className="section-kicker w-fit">Identitas</div>
                            <h2 className="display-font text-5xl leading-[0.9] md:text-6xl">SIAPKAN PROFIL DASAR</h2>
                            <p className="text-base leading-8 text-[var(--tm-muted)]">
                                Gunakan identitas yang jelas agar kandidat atau creator lain langsung memahami konteks Anda.
                            </p>
                        </div>

                        {stepOneState.formError && <div className="brutal-alert-error text-sm">{stepOneState.formError}</div>}

                        <div className="grid gap-5 md:grid-cols-2">
                            <div className="grid gap-2">
                                <label htmlFor="full_name" className="brutal-label">
                                    Nama Lengkap
                                </label>
                                <input
                                    id="full_name"
                                    name="full_name"
                                    className="brutal-input"
                                    defaultValue={profile?.fullName ?? ""}
                                    disabled={stepOnePending}
                                />
                                {firstError(stepOneState.fieldErrors, "full_name") && (
                                    <p className="text-sm font-semibold text-[var(--tm-danger)]">
                                        {firstError(stepOneState.fieldErrors, "full_name")}
                                    </p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <label htmlFor="campus_name" className="brutal-label">
                                    Kampus
                                </label>
                                <input
                                    id="campus_name"
                                    name="campus_name"
                                    className="brutal-input"
                                    defaultValue={profile?.campusName ?? ""}
                                    disabled={stepOnePending}
                                />
                                {firstError(stepOneState.fieldErrors, "campus_name") && (
                                    <p className="text-sm font-semibold text-[var(--tm-danger)]">
                                        {firstError(stepOneState.fieldErrors, "campus_name")}
                                    </p>
                                )}
                            </div>
                            <div className="grid gap-2 md:col-span-2">
                                <label htmlFor="username" className="brutal-label">
                                    Username
                                </label>
                                <input
                                    id="username"
                                    name="username"
                                    className="brutal-input"
                                    defaultValue={profile?.username ?? ""}
                                    disabled={stepOnePending}
                                />
                                {firstError(stepOneState.fieldErrors, "username") && (
                                    <p className="text-sm font-semibold text-[var(--tm-danger)]">
                                        {firstError(stepOneState.fieldErrors, "username")}
                                    </p>
                                )}
                            </div>
                            <div className="grid gap-2 md:col-span-2">
                                <label htmlFor="bio" className="brutal-label">
                                    Bio Singkat
                                </label>
                                <textarea
                                    id="bio"
                                    name="bio"
                                    rows={4}
                                    className="brutal-textarea"
                                    defaultValue={profile?.bio ?? ""}
                                    disabled={stepOnePending}
                                />
                                {firstError(stepOneState.fieldErrors, "bio") && (
                                    <p className="text-sm font-semibold text-[var(--tm-danger)]">
                                        {firstError(stepOneState.fieldErrors, "bio")}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button type="submit" disabled={stepOnePending} className="brutal-button min-w-[220px]">
                                {stepOnePending ? "Menyimpan..." : "Lanjut ke skill"}
                            </button>
                        </div>
                    </form>
                )}

                {currentStep === 2 && (
                    <form action={stepTwoAction} className="grid gap-6">
                        <div className="space-y-3">
                            <div className="section-kicker w-fit">Skill & minat</div>
                            <h2 className="display-font text-5xl leading-[0.9] md:text-6xl">PILIH SKILL DAN LOMBA</h2>
                        </div>

                        {stepTwoState.formError && <div className="brutal-alert-error text-sm">{stepTwoState.formError}</div>}

                        <div className="grid gap-6">
                            <div className="grid gap-3">
                                <p className="brutal-label">Skill Utama Anda</p>
                                <div className="grid gap-3 md:grid-cols-2">
                                    {skills.map((skill) => (
                                        <label key={skill.id} className="brutal-panel-soft flex items-center gap-3 p-4">
                                            <input
                                                type="checkbox"
                                                name="skills"
                                                value={skill.id}
                                                defaultChecked={selectedSkillIds.has(skill.id)}
                                                disabled={stepTwoPending}
                                            />
                                            <span>
                                                <span className="display-font block text-xl leading-none">{skill.label}</span>
                                                <span className="text-sm text-[var(--tm-muted)]">{skill.category}</span>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                {firstError(stepTwoState.fieldErrors, "skills") && (
                                    <p className="text-sm font-semibold text-[var(--tm-danger)]">
                                        {firstError(stepTwoState.fieldErrors, "skills")}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-3">
                                <p className="brutal-label">Jenis Lomba Diminati</p>
                                <div className="grid gap-3 md:grid-cols-2">
                                    {competitionTypes.map((competitionType) => (
                                        <label
                                            key={competitionType.id}
                                            className="brutal-panel-soft flex items-center gap-3 p-4"
                                        >
                                            <input
                                                type="checkbox"
                                                name="competition_types"
                                                value={competitionType.id}
                                                defaultChecked={selectedCompetitionTypeIds.has(competitionType.id)}
                                                disabled={stepTwoPending}
                                            />
                                            <span className="display-font text-xl leading-none">{competitionType.label}</span>
                                        </label>
                                    ))}
                                </div>
                                {firstError(stepTwoState.fieldErrors, "competition_types") && (
                                    <p className="text-sm font-semibold text-[var(--tm-danger)]">
                                        {firstError(stepTwoState.fieldErrors, "competition_types")}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-between gap-3">
                            <button type="button" onClick={() => setCurrentStep(1)} className="brutal-button-secondary">
                                Kembali
                            </button>
                            <button type="submit" disabled={stepTwoPending} className="brutal-button min-w-[220px]">
                                {stepTwoPending ? "Menyimpan..." : "Lanjut ke availability"}
                            </button>
                        </div>
                    </form>
                )}

                {currentStep === 3 && (
                    <form action={stepThreeAction} className="grid gap-6">
                        <div className="space-y-3">
                            <div className="section-kicker w-fit">Availability & privasi</div>
                            <h2 className="display-font text-5xl leading-[0.9] md:text-6xl">ATUR RITME KERJA ANDA</h2>
                        </div>

                        {stepThreeState.formError && (
                            <div className="brutal-alert-error text-sm">{stepThreeState.formError}</div>
                        )}

                        <div className="grid gap-6">
                            <div className="grid gap-3">
                                <p className="brutal-label">Bulan Ketersediaan</p>
                                <div className="grid gap-3 md:grid-cols-3">
                                    {Object.entries(dashboardMonthLabels).map(([value, label]) => (
                                        <label key={value} className="brutal-panel-soft flex items-center gap-3 p-4">
                                            <input
                                                type="checkbox"
                                                name="available_months"
                                                value={value}
                                                defaultChecked={selectedMonths.has(value as DashboardMonth)}
                                                disabled={stepThreePending}
                                            />
                                            <span className="display-font text-xl leading-none">{label}</span>
                                        </label>
                                    ))}
                                </div>
                                {firstError(stepThreeState.fieldErrors, "available_months") && (
                                    <p className="text-sm font-semibold text-[var(--tm-danger)]">
                                        {firstError(stepThreeState.fieldErrors, "available_months")}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <label htmlFor="hours_per_week" className="brutal-label">
                                    Jam per Minggu
                                </label>
                                <input
                                    id="hours_per_week"
                                    name="hours_per_week"
                                    type="number"
                                    min={1}
                                    max={80}
                                    className="brutal-input"
                                    defaultValue={profile?.hoursPerWeek ?? 8}
                                    disabled={stepThreePending}
                                />
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                                <label className="brutal-panel-soft grid gap-3 p-4">
                                    <span className="brutal-label">Profil</span>
                                    <select
                                        name="public_visibility"
                                        className="brutal-select"
                                        defaultValue={profile?.visibility ?? "public"}
                                        disabled={stepThreePending}
                                    >
                                        <option value="public">Publik</option>
                                        <option value="private">Privat</option>
                                    </select>
                                </label>
                                <label className="brutal-panel-soft grid gap-3 p-4">
                                    <span className="brutal-label">Riwayat Lomba</span>
                                    <select
                                        name="show_competition_history"
                                        className="brutal-select"
                                        defaultValue={profile?.showCompetitionHistory ? "true" : "false"}
                                        disabled={stepThreePending}
                                    >
                                        <option value="true">Tampilkan</option>
                                        <option value="false">Sembunyikan</option>
                                    </select>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-between gap-3">
                            <button type="button" onClick={() => setCurrentStep(2)} className="brutal-button-secondary">
                                Kembali
                            </button>
                            <button type="submit" disabled={stepThreePending} className="brutal-button min-w-[220px]">
                                {stepThreePending ? "Menyelesaikan..." : "Selesaikan profil"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
