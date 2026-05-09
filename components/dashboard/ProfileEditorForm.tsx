"use client";

import { useActionState, useState } from "react";
import { updateProfile } from "@/app/(dashboard)/dashboard/actions";
import { profileInitialState } from "@/lib/forms";
import { dashboardMonthLabels } from "@/lib/platform";
import { getFirstFieldError } from "@/lib/shared/form-errors";
import { ChipInput } from "@/components/dashboard/ChipInput";
import type { CompetitionTypeRecord, DashboardMonth, ProfileRecord, SkillOption } from "@/lib/types";

interface ProfileEditorFormProps {
    competitionTypes: CompetitionTypeRecord[];
    profile: ProfileRecord;
    skills: SkillOption[];
}

export default function ProfileEditorForm({ competitionTypes, profile, skills }: ProfileEditorFormProps) {
    const [state, formAction, pending] = useActionState(updateProfile, profileInitialState);

    const customSkills = profile.skills.filter((skill) => skill.slug.startsWith("custom-"));
    const customCompetitions = profile.competitionTypes.filter((comp) => comp.slug.startsWith("custom-"));

    const savedTaxonomySkillIds = new Set(
        profile.skills
            .filter((skill) => !skill.slug.startsWith("custom-"))
            .map((skill) => skill.id)
    );
    const savedTaxonomyCompetitionIds = new Set(
        profile.competitionTypes
            .filter((comp) => !comp.slug.startsWith("custom-"))
            .map((comp) => comp.id)
    );
    const selectedMonths = new Set(profile.availableMonths);

    const [selectedTaxonomySkillIds, setSelectedTaxonomySkillIds] = useState<Set<string>>(savedTaxonomySkillIds);
    const [selectedTaxonomyCompetitionIds, setSelectedTaxonomyCompetitionIds] = useState<Set<string>>(savedTaxonomyCompetitionIds);

    const [showCustomSkills, setShowCustomSkills] = useState(customSkills.length > 0);
    const [showCustomCompetitions, setShowCustomCompetitions] = useState(customCompetitions.length > 0);
    const [customSkillsCount, setCustomSkillsCount] = useState(customSkills.length);
    const [customCompetitionsCount, setCustomCompetitionsCount] = useState(customCompetitions.length);

    const totalSkills = selectedTaxonomySkillIds.size + customSkillsCount;
    const totalCompetitions = selectedTaxonomyCompetitionIds.size + customCompetitionsCount;

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
                        {getFirstFieldError(state.fieldErrors, "full_name") && (
                            <p className="text-sm font-semibold text-[var(--tm-danger)]">
                                {getFirstFieldError(state.fieldErrors, "full_name")}
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
                    <div className="grid gap-3">
                        <div className="flex items-center justify-between">
                            <p className="brutal-label">Skill Utama</p>
                            <span className="text-sm text-[var(--tm-muted)]">{totalSkills}/5</span>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                            {skills
                                .filter((skill) => skill.label.toLowerCase() !== "lainnya")
                                .map((skill) => (
                                    <label key={skill.id} className="brutal-panel-soft flex items-center gap-3 p-4">
                                        <input
                                            type="checkbox"
                                            name="skills"
                                            value={skill.id}
                                            defaultChecked={savedTaxonomySkillIds.has(skill.id)}
                                            onChange={(e) => {
                                                const newSet = new Set(selectedTaxonomySkillIds);
                                                if (e.target.checked) {
                                                    newSet.add(skill.id);
                                                } else {
                                                    newSet.delete(skill.id);
                                                }
                                                setSelectedTaxonomySkillIds(newSet);
                                            }}
                                            disabled={pending}
                                        />
                                        <span>
                                            <span className="display-font block text-xl leading-none">{skill.label}</span>
                                            <span className="text-sm text-[var(--tm-muted)]">{skill.category}</span>
                                        </span>
                                    </label>
                                ))}
                        </div>

                        <label className="brutal-panel-soft flex items-center gap-3 p-4">
                            <input
                                type="checkbox"
                                checked={showCustomSkills}
                                onChange={(e) => setShowCustomSkills(e.target.checked)}
                                disabled={pending}
                            />
                            <span className="display-font text-xl leading-none">Lainnya</span>
                        </label>

                        {showCustomSkills && (
                            <ChipInput
                                name="custom_skills"
                                label="Skill Custom"
                                placeholder="Ketik skill lainnya, tekan Enter..."
                                maxItems={5}
                                currentCount={selectedTaxonomySkillIds.size}
                                disabled={pending}
                                defaultItems={customSkills.map((s) => s.label)}
                                onItemsChange={(items) => setCustomSkillsCount(items.length)}
                                helperText="Masukkan skill yang tidak ada di daftar pilihan."
                            />
                        )}

                        {getFirstFieldError(state.fieldErrors, "skills") && (
                            <p className="text-sm font-semibold text-[var(--tm-danger)]">
                                {getFirstFieldError(state.fieldErrors, "skills")}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-3">
                        <div className="flex items-center justify-between">
                            <p className="brutal-label">Jenis Lomba Diminati</p>
                            <span className="text-sm text-[var(--tm-muted)]">{totalCompetitions}/5</span>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                            {competitionTypes
                                .filter((ct) => ct.label.toLowerCase() !== "lainnya")
                                .map((competitionType) => (
                                    <label
                                        key={competitionType.id}
                                        className="brutal-panel-soft flex items-center gap-3 p-4"
                                    >
                                        <input
                                            type="checkbox"
                                            name="competition_types"
                                            value={competitionType.id}
                                            defaultChecked={savedTaxonomyCompetitionIds.has(competitionType.id)}
                                            disabled={pending}
                                            onChange={(e) => {
                                                const newSet = new Set(selectedTaxonomyCompetitionIds);
                                                if (e.target.checked) {
                                                    newSet.add(competitionType.id);
                                                } else {
                                                    newSet.delete(competitionType.id);
                                                }
                                                setSelectedTaxonomyCompetitionIds(newSet);
                                            }}
                                        />
                                        <span className="display-font text-xl leading-none">{competitionType.label}</span>
                                    </label>
                                ))}
                        </div>

                        <label className="brutal-panel-soft flex items-center gap-3 p-4">
                            <input
                                type="checkbox"
                                checked={showCustomCompetitions}
                                onChange={(e) => setShowCustomCompetitions(e.target.checked)}
                                disabled={pending}
                            />
                            <span className="display-font text-xl leading-none">Lainnya</span>
                        </label>

                        {showCustomCompetitions && (
                            <ChipInput
                                name="custom_competition_types"
                                label="Jenis Lomba Custom"
                                placeholder="Ketik jenis lomba lainnya, tekan Enter..."
                                maxItems={5}
                                currentCount={selectedTaxonomyCompetitionIds.size}
                                disabled={pending}
                                defaultItems={customCompetitions.map((c) => c.label)}
                                onItemsChange={(items) => setCustomCompetitionsCount(items.length)}
                                helperText="Masukkan jenis lomba yang tidak ada di daftar pilihan."
                            />
                        )}

                        {getFirstFieldError(state.fieldErrors, "competition_types") && (
                            <p className="text-sm font-semibold text-[var(--tm-danger)]">
                                {getFirstFieldError(state.fieldErrors, "competition_types")}
                            </p>
                        )}
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