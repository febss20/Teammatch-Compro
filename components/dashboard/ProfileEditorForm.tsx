"use client";

import { useActionState, useState } from "react";
import { updateProfile } from "@/app/(dashboard)/dashboard/actions";
import { profileInitialState } from "@/lib/forms";
import { PROFILE_MAX_COMPETITION_TYPES, PROFILE_MAX_SKILLS } from "@/lib/profile/constants";
import { dashboardMonthLabels } from "@/lib/platform";
import { getFirstFieldError } from "@/lib/shared/form-errors";
import { getStringArrayFormValue, getStringFormValue } from "@/lib/shared/form-values";
import { ChipInput } from "@/components/dashboard/ChipInput";
import ProfileAvatarUploader from "@/components/dashboard/ProfileAvatarUploader";
import type { CompetitionTypeRecord, ProfileRecord, SkillOption } from "@/lib/types";

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
        profile.skills.filter((skill) => !skill.slug.startsWith("custom-")).map((skill) => skill.id),
    );
    const savedTaxonomyCompetitionIds = new Set(
        profile.competitionTypes.filter((comp) => !comp.slug.startsWith("custom-")).map((comp) => comp.id),
    );
    const selectedMonths = new Set(profile.availableMonths);

    const [selectedTaxonomySkillIds, setSelectedTaxonomySkillIds] = useState<Set<string>>(savedTaxonomySkillIds);
    const [selectedTaxonomyCompetitionIds, setSelectedTaxonomyCompetitionIds] =
        useState<Set<string>>(savedTaxonomyCompetitionIds);

    const [showCustomSkills, setShowCustomSkills] = useState(customSkills.length > 0);
    const [showCustomCompetitions, setShowCustomCompetitions] = useState(customCompetitions.length > 0);
    const [customSkillsCount, setCustomSkillsCount] = useState(customSkills.length);
    const [customCompetitionsCount, setCustomCompetitionsCount] = useState(customCompetitions.length);

    const totalSkills = selectedTaxonomySkillIds.size + customSkillsCount;
    const totalCompetitions = selectedTaxonomyCompetitionIds.size + customCompetitionsCount;
    const isSkillLimitReached = totalSkills >= PROFILE_MAX_SKILLS;
    const isCompetitionLimitReached = totalCompetitions >= PROFILE_MAX_COMPETITION_TYPES;
    const submittedSkillIds = getStringArrayFormValue(state.values, "skills");
    const submittedCompetitionIds = getStringArrayFormValue(state.values, "competition_types");
    const submittedCustomSkills = getStringArrayFormValue(state.values, "custom_skills");
    const submittedCustomCompetitions = getStringArrayFormValue(state.values, "custom_competition_types");
    const submittedAvailableMonths = getStringArrayFormValue(state.values, "available_months");
    const formCustomSkillLabels = submittedCustomSkills ?? customSkills.map((s) => s.label);
    const formCustomCompetitionLabels = submittedCustomCompetitions ?? customCompetitions.map((c) => c.label);
    const formSkillIds = submittedSkillIds ? new Set(submittedSkillIds) : savedTaxonomySkillIds;
    const formCompetitionIds = submittedCompetitionIds ? new Set(submittedCompetitionIds) : savedTaxonomyCompetitionIds;
    const formAvailableMonths = new Set(submittedAvailableMonths ?? Array.from(selectedMonths));

    return (
        <form action={formAction} className="brutal-stack">
            <div className="brutal-panel grid gap-8 bg-[var(--tm-paper-strong)] p-6 md:p-8">
                {state.formError && <div className="brutal-alert-error text-sm">{state.formError}</div>}
                {state.success && state.message && <div className="brutal-alert-success text-sm">{state.message}</div>}

                <ProfileAvatarUploader profile={profile} />

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="grid gap-2">
                        <label htmlFor="full_name" className="brutal-label">
                            Nama Lengkap
                        </label>
                        <input
                            id="full_name"
                            name="full_name"
                            className="brutal-input"
                            defaultValue={getStringFormValue(state.values, "full_name") ?? profile.fullName ?? ""}
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
                            defaultValue={getStringFormValue(state.values, "campus_name") ?? profile.campusName ?? ""}
                            disabled={pending}
                        />
                        {getFirstFieldError(state.fieldErrors, "campus_name") && (
                            <p className="text-sm font-semibold text-[var(--tm-danger)]">
                                {getFirstFieldError(state.fieldErrors, "campus_name")}
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
                            defaultValue={getStringFormValue(state.values, "username") ?? profile.username ?? ""}
                            disabled={pending}
                        />
                        {getFirstFieldError(state.fieldErrors, "username") && (
                            <p className="text-sm font-semibold text-[var(--tm-danger)]">
                                {getFirstFieldError(state.fieldErrors, "username")}
                            </p>
                        )}
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
                            defaultValue={getStringFormValue(state.values, "bio") ?? profile.bio ?? ""}
                            disabled={pending}
                        />
                        {getFirstFieldError(state.fieldErrors, "bio") && (
                            <p className="text-sm font-semibold text-[var(--tm-danger)]">
                                {getFirstFieldError(state.fieldErrors, "bio")}
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid gap-4">
                    <div className="section-kicker w-fit">Skill & minat</div>
                    <div className="grid gap-3">
                        <div className="flex items-center justify-between">
                            <p className="brutal-label">Skill Utama</p>
                            <span
                                className={`text-sm ${
                                    isSkillLimitReached ? "font-semibold text-[var(--tm-danger)]" : "text-[var(--tm-muted)]"
                                }`}
                            >
                                {totalSkills}/{PROFILE_MAX_SKILLS}
                            </span>
                        </div>
                        {isSkillLimitReached && (
                            <p className="text-sm font-semibold text-[var(--tm-muted)]">
                                Maksimal {PROFILE_MAX_SKILLS} skill. Hapus salah satu untuk menambahkan skill lain.
                            </p>
                        )}
                        <div className="grid gap-3 md:grid-cols-2">
                            {skills
                                .filter((skill) => skill.label.toLowerCase() !== "lainnya")
                                .map((skill) => {
                                    const isSelected = selectedTaxonomySkillIds.has(skill.id);
                                    return (
                                        <label
                                            key={skill.id}
                                            className={`brutal-panel-soft flex items-center gap-3 p-4 ${
                                                isSkillLimitReached && !isSelected ? "opacity-50" : ""
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                name="skills"
                                                value={skill.id}
                                                defaultChecked={formSkillIds.has(skill.id)}
                                                onChange={(e) => {
                                                    const newSet = new Set(selectedTaxonomySkillIds);
                                                    if (e.target.checked) {
                                                        newSet.add(skill.id);
                                                    } else {
                                                        newSet.delete(skill.id);
                                                    }
                                                    setSelectedTaxonomySkillIds(newSet);
                                                }}
                                                disabled={pending || (isSkillLimitReached && !isSelected)}
                                            />
                                            <span>
                                                <span className="display-font block text-xl leading-none">{skill.label}</span>
                                                <span className="text-sm text-[var(--tm-muted)]">{skill.category}</span>
                                            </span>
                                        </label>
                                    );
                                })}
                        </div>

                        <label className="brutal-panel-soft flex items-center gap-3 p-4">
                            <input
                                type="checkbox"
                                checked={showCustomSkills}
                                onChange={(e) => {
                                    setShowCustomSkills(e.target.checked);
                                    setCustomSkillsCount(e.target.checked ? formCustomSkillLabels.length : 0);
                                }}
                                disabled={pending}
                            />
                            <span className="display-font text-xl leading-none">Lainnya</span>
                        </label>

                        {showCustomSkills && (
                            <ChipInput
                                name="custom_skills"
                                label="Skill Custom"
                                placeholder="Ketik skill lainnya, tekan Enter..."
                                maxItems={PROFILE_MAX_SKILLS}
                                currentCount={selectedTaxonomySkillIds.size}
                                disabled={pending}
                                defaultItems={formCustomSkillLabels}
                                errorMessage={getFirstFieldError(state.fieldErrors, "custom_skills")}
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
                            <span
                                className={`text-sm ${
                                    isCompetitionLimitReached
                                        ? "font-semibold text-[var(--tm-danger)]"
                                        : "text-[var(--tm-muted)]"
                                }`}
                            >
                                {totalCompetitions}/{PROFILE_MAX_COMPETITION_TYPES}
                            </span>
                        </div>
                        {isCompetitionLimitReached && (
                            <p className="text-sm font-semibold text-[var(--tm-muted)]">
                                Maksimal {PROFILE_MAX_COMPETITION_TYPES} jenis lomba. Hapus salah satu untuk menambahkan jenis
                                lomba lain.
                            </p>
                        )}
                        <div className="grid gap-3 md:grid-cols-2">
                            {competitionTypes
                                .filter((ct) => ct.label.toLowerCase() !== "lainnya")
                                .map((competitionType) => {
                                    const isSelected = selectedTaxonomyCompetitionIds.has(competitionType.id);
                                    return (
                                        <label
                                            key={competitionType.id}
                                            className={`brutal-panel-soft flex items-center gap-3 p-4 ${
                                                isCompetitionLimitReached && !isSelected ? "opacity-50" : ""
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                name="competition_types"
                                                value={competitionType.id}
                                                defaultChecked={formCompetitionIds.has(competitionType.id)}
                                                disabled={pending || (isCompetitionLimitReached && !isSelected)}
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
                                    );
                                })}
                        </div>

                        <label className="brutal-panel-soft flex items-center gap-3 p-4">
                            <input
                                type="checkbox"
                                checked={showCustomCompetitions}
                                onChange={(e) => {
                                    setShowCustomCompetitions(e.target.checked);
                                    setCustomCompetitionsCount(e.target.checked ? formCustomCompetitionLabels.length : 0);
                                }}
                                disabled={pending}
                            />
                            <span className="display-font text-xl leading-none">Lainnya</span>
                        </label>

                        {showCustomCompetitions && (
                            <ChipInput
                                name="custom_competition_types"
                                label="Jenis Lomba Custom"
                                placeholder="Ketik jenis lomba lainnya, tekan Enter..."
                                maxItems={PROFILE_MAX_COMPETITION_TYPES}
                                currentCount={selectedTaxonomyCompetitionIds.size}
                                disabled={pending}
                                defaultItems={formCustomCompetitionLabels}
                                errorMessage={getFirstFieldError(state.fieldErrors, "custom_competition_types")}
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
                                    defaultChecked={formAvailableMonths.has(value)}
                                    disabled={pending}
                                />
                                <span className="display-font text-xl leading-none">{label}</span>
                            </label>
                        ))}
                    </div>
                    {getFirstFieldError(state.fieldErrors, "available_months") && (
                        <p className="text-sm font-semibold text-[var(--tm-danger)]">
                            {getFirstFieldError(state.fieldErrors, "available_months")}
                        </p>
                    )}
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
                                defaultValue={getStringFormValue(state.values, "hours_per_week") ?? profile.hoursPerWeek ?? 8}
                                disabled={pending}
                            />
                            {getFirstFieldError(state.fieldErrors, "hours_per_week") && (
                                <p className="text-sm font-semibold text-[var(--tm-danger)]">
                                    {getFirstFieldError(state.fieldErrors, "hours_per_week")}
                                </p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <label className="brutal-label">Visibilitas Profil</label>
                            <select
                                name="public_visibility"
                                className="brutal-select"
                                defaultValue={getStringFormValue(state.values, "public_visibility") ?? profile.visibility}
                                disabled={pending}
                            >
                                <option value="public">Publik</option>
                                <option value="private">Privat</option>
                            </select>
                            {getFirstFieldError(state.fieldErrors, "public_visibility") && (
                                <p className="text-sm font-semibold text-[var(--tm-danger)]">
                                    {getFirstFieldError(state.fieldErrors, "public_visibility")}
                                </p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <label className="brutal-label">Riwayat Lomba</label>
                            <select
                                name="show_competition_history"
                                className="brutal-select"
                                defaultValue={
                                    getStringFormValue(state.values, "show_competition_history") ??
                                    (profile.showCompetitionHistory ? "true" : "false")
                                }
                                disabled={pending}
                            >
                                <option value="true">Tampilkan</option>
                                <option value="false">Sembunyikan</option>
                            </select>
                            {getFirstFieldError(state.fieldErrors, "show_competition_history") && (
                                <p className="text-sm font-semibold text-[var(--tm-danger)]">
                                    {getFirstFieldError(state.fieldErrors, "show_competition_history")}
                                </p>
                            )}
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
