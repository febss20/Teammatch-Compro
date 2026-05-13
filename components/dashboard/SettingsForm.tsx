"use client";

import { useActionState } from "react";
import { updateSettings } from "@/app/(dashboard)/dashboard/actions";
import { settingsInitialState } from "@/lib/forms";
import { getFirstFieldError } from "@/lib/shared/form-errors";
import { getStringFormValue } from "@/lib/shared/form-values";
import type { ProfileRecord } from "@/lib/types";

interface SettingsFormProps {
    preferences: {
        board_updates: boolean;
        commitment_updates: boolean;
        reminder_updates: boolean;
        request_updates: boolean;
    } | null;
    profile: ProfileRecord;
}

export default function SettingsForm({ preferences, profile }: SettingsFormProps) {
    const [state, formAction, pending] = useActionState(updateSettings, settingsInitialState);
    const notificationFields = [
        { name: "request_updates", label: "Update request", checked: preferences?.request_updates ?? true },
        { name: "board_updates", label: "Update lamaran board", checked: preferences?.board_updates ?? true },
        { name: "commitment_updates", label: "Update komitmen tim", checked: preferences?.commitment_updates ?? true },
        { name: "reminder_updates", label: "Reminder penting", checked: preferences?.reminder_updates ?? true },
    ] as const;

    return (
        <form action={formAction} className="brutal-stack">
            <div className="brutal-panel grid gap-8 bg-[var(--tm-paper-strong)] p-6 md:p-8">
                {state.formError && <div className="brutal-alert-error text-sm">{state.formError}</div>}
                {state.success && state.message && <div className="brutal-alert-success text-sm">{state.message}</div>}

                <div className="grid gap-6 md:grid-cols-2">
                    <label className="brutal-panel-soft grid gap-3 p-4">
                        <span className="brutal-label">Visibilitas Profil</span>
                        <select
                            name="public_visibility"
                            defaultValue={getStringFormValue(state.values, "public_visibility") ?? profile.visibility}
                            disabled={pending}
                            className="brutal-select"
                        >
                            <option value="public">Publik</option>
                            <option value="private">Privat</option>
                        </select>
                        {getFirstFieldError(state.fieldErrors, "public_visibility") && (
                            <span className="text-sm font-semibold text-[var(--tm-danger)]">
                                {getFirstFieldError(state.fieldErrors, "public_visibility")}
                            </span>
                        )}
                    </label>
                    <label className="brutal-panel-soft grid gap-3 p-4">
                        <span className="brutal-label">Riwayat Lomba</span>
                        <select
                            name="show_competition_history"
                            defaultValue={
                                getStringFormValue(state.values, "show_competition_history") ??
                                (profile.showCompetitionHistory ? "true" : "false")
                            }
                            disabled={pending}
                            className="brutal-select"
                        >
                            <option value="true">Tampilkan</option>
                            <option value="false">Sembunyikan</option>
                        </select>
                        {getFirstFieldError(state.fieldErrors, "show_competition_history") && (
                            <span className="text-sm font-semibold text-[var(--tm-danger)]">
                                {getFirstFieldError(state.fieldErrors, "show_competition_history")}
                            </span>
                        )}
                    </label>
                </div>

                <div className="grid gap-4">
                    <div className="section-kicker w-fit">Notifikasi</div>
                    <div className="grid gap-3 md:grid-cols-2">
                        {notificationFields.map((field) => (
                            <label key={field.name} className="brutal-panel-soft flex items-center justify-between gap-3 p-4">
                                <span className="display-font text-2xl leading-none">{field.label}</span>
                                <select
                                    name={field.name}
                                    defaultValue={
                                        getStringFormValue(state.values, field.name) ?? (field.checked ? "true" : "false")
                                    }
                                    className="brutal-select max-w-[160px]"
                                    disabled={pending}
                                >
                                    <option value="true">Aktif</option>
                                    <option value="false">Nonaktif</option>
                                </select>
                                {getFirstFieldError(state.fieldErrors, field.name) && (
                                    <span className="text-sm font-semibold text-[var(--tm-danger)]">
                                        {getFirstFieldError(state.fieldErrors, field.name)}
                                    </span>
                                )}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end">
                    <button type="submit" disabled={pending} className="brutal-button min-w-[220px]">
                        {pending ? "Menyimpan..." : "Simpan pengaturan"}
                    </button>
                </div>
            </div>
        </form>
    );
}
