"use client";

import { useActionState } from "react";
import { updatePassword } from "@/app/(dashboard)/dashboard/actions";
import { passwordChangeInitialState } from "@/lib/forms";

export default function PasswordChangeForm() {
    const [state, formAction, pending] = useActionState(updatePassword, passwordChangeInitialState);

    return (
        <form action={formAction} className="brutal-panel grid gap-6 bg-[var(--tm-paper-strong)] p-6 md:p-8">
            <div className="space-y-3">
                <div className="section-kicker w-fit">Security</div>
                <h2 className="display-font text-4xl leading-none">PERBARUI PASSWORD AKUN</h2>
                <p className="text-sm leading-7 text-[var(--tm-muted)]">
                    Gunakan password baru yang berbeda dari password sebelumnya agar akses dashboard tetap aman.
                </p>
            </div>

            {state.formError && <div className="brutal-alert-error text-sm">{state.formError}</div>}
            {state.success && state.message && <div className="brutal-alert-success text-sm">{state.message}</div>}

            <div className="grid gap-4 md:grid-cols-3">
                <label className="grid gap-2">
                    <span className="brutal-label">Password Saat Ini</span>
                    <input
                        name="current_password"
                        type="password"
                        className="brutal-input"
                        autoComplete="current-password"
                        disabled={pending}
                    />
                </label>
                <label className="grid gap-2">
                    <span className="brutal-label">Password Baru</span>
                    <input
                        name="new_password"
                        type="password"
                        className="brutal-input"
                        autoComplete="new-password"
                        disabled={pending}
                    />
                </label>
                <label className="grid gap-2">
                    <span className="brutal-label">Konfirmasi Password Baru</span>
                    <input
                        name="confirm_new_password"
                        type="password"
                        className="brutal-input"
                        autoComplete="new-password"
                        disabled={pending}
                    />
                </label>
            </div>

            <div className="flex justify-end">
                <button type="submit" disabled={pending} className="brutal-button min-w-[220px]">
                    {pending ? "Memperbarui..." : "Ubah password"}
                </button>
            </div>
        </form>
    );
}
