"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/(dashboard)/dashboard/actions";
import { profileInitialState } from "@/lib/forms";
import { dashboardMonthLabels } from "@/lib/platform";
import type { CompetitionTypeRecord, DashboardMonth, ProfileRecord, SkillOption } from "@/lib/types";

interface ProfileEditorFormProps {
    competitionTypes: CompetitionTypeRecord[];
    profile: ProfileRecord;
    skills: SkillOption[];
}

function firstError(fieldErrors: Partial<Record<string, string[]>>, fieldName: string) {
    return fieldErrors[fieldName]?.[0] ?? null;
}

export default function ProfileEditorForm({ competitionTypes, profile, skills }: ProfileEditorFormProps) {
    const [state, formAction, pending] = useActionState(updateProfile, profileInitialState);
    const selectedSkillIds = new Set(profile.skills.map((skill) => skill.id));
    const selectedCompetitionTypeIds = new Set(profile.competitionTypes.map((competitionType) => competitionType.id));
    const selectedMonths = new Set(profile.availableMonths);

    return (
        <form action={formAction} className="brutal-stack">
            <div className="brutal-panel grid gap-8 bg-[var(--tm-paper-strong)] p-6 md:p-8">
                {state.formError && <div className="brutal-alert-error text-sm">{state.formError}</div>}
                {state.success && state.message && <div className="brutal-alert-success text-sm">{state.message}</div>}

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="grid gap-2">
                        <label htmlFor="full_name" className="brutal-label">
                            Nama Lengkap
                        </label>
                        <input
                            id="full_name"
                            name="full_name"
                            className="brutal-input"
                            defaultValue={profile.fullName ?? ""}
                            disabled={pending}
                        />
                        {firstError(state.fieldErrors, "full_name") && (
                            <p className="text-sm font-semibold text-[var(--tm-danger)]">
                                {firstError(state.fieldErrors, "full_name")}
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
                            defaultValue={profile.campusName ?? ""}
                            disabled={pending}
                        />
                    </div>
                    <div className="grid gap-2 md:col-span-2">
                        <label htmlFor="username" className="brutal-label">
                            Username
                        </label>
                        <input
                            id="username"
                            name="username"
                            className="brutal-input"
                            defaultValue={profile.username ?? ""}
                            disabled={pending}
                        />
                    </div>
                    <div className="grid gap-2 md:col-span-2">
                        <label htmlFor="bio" className="brutal-label">
                            Bio
                        </label>
                        <textarea
                            id="bio"
                            name="bio"
                            rows={4}
                            className="brutal-textarea"
                            defaultValue={profile.bio ?? ""}
                            disabled={pending}
                        />
                    </div>
                </div>

                <div className="grid gap-4">
                    <div className="section-kicker w-fit">Skill & minat</div>
                    <div className="grid gap-3 md:grid-cols-2">
                        {skills.map((skill) => (
                            <label key={skill.id} className="brutal-panel-soft flex items-center gap-3 p-4">
                                <input
                                    type="checkbox"
                                    name="skills"
                                    value={skill.id}
                                    defaultChecked={selectedSkillIds.has(skill.id)}
                                    disabled={pending}
                                />
                                <span>
                                    <span className="display-font block text-xl leading-none">{skill.label}</span>
                                    <span className="text-sm text-[var(--tm-muted)]">{skill.category}</span>
                                </span>
                            </label>
                        ))}
                    </div>
                    {firstError(state.fieldErrors, "skills") && (
                        <p className="text-sm font-semibold text-[var(--tm-danger)]">
                            {firstError(state.fieldErrors, "skills")}
                        </p>
                    )}

                    <div className="grid gap-3 md:grid-cols-2">
                        {competitionTypes.map((competitionType) => (
                            <label key={competitionType.id} className="brutal-panel-soft flex items-center gap-3 p-4">
                                <input
                                    type="checkbox"
                                    name="competition_types"
                                    value={competitionType.id}
                                    defaultChecked={selectedCompetitionTypeIds.has(competitionType.id)}
                                    disabled={pending}
                                />
                                <span className="display-font text-xl leading-none">{competitionType.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="grid gap-4">
                    <div className="section-kicker w-fit">Availability & privasi</div>
                    <div className="grid gap-3 md:grid-cols-3">
                        {Object.entries(dashboardMonthLabels).map(([value, label]) => (
                            <label key={value} className="brutal-panel-soft flex items-center gap-3 p-4">
                                <input
                                    type="checkbox"
                                    name="available_months"
                                    value={value}
                                    defaultChecked={selectedMonths.has(value as DashboardMonth)}
                                    disabled={pending}
                                />
                                <span className="display-font text-xl leading-none">{label}</span>
                            </label>
                        ))}
                    </div>
                    <div className="grid gap-6 md:grid-cols-3">
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
                                defaultValue={profile.hoursPerWeek ?? 8}
                                disabled={pending}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="brutal-label">Visibilitas Profil</label>
                            <select
                                name="public_visibility"
                                className="brutal-select"
                                defaultValue={profile.visibility}
                                disabled={pending}
                            >
                                <option value="public">Publik</option>
                                <option value="private">Privat</option>
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <label className="brutal-label">Riwayat Lomba</label>
                            <select
                                name="show_competition_history"
                                className="brutal-select"
                                defaultValue={profile.showCompetitionHistory ? "true" : "false"}
                                disabled={pending}
                            >
                                <option value="true">Tampilkan</option>
                                <option value="false">Sembunyikan</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button type="submit" disabled={pending} className="brutal-button min-w-[220px]">
                        {pending ? "Menyimpan profil..." : "Simpan perubahan"}
                    </button>
                </div>
            </div>
        </form>
    );
}
