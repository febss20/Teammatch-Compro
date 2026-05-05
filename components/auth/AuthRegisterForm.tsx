"use client";

import { useActionState } from "react";
import { registerAction } from "@/app/(auth)/register/actions";
import { registerInitialState } from "@/lib/forms";

function getFieldError(fieldErrors: Partial<Record<string, string[]>>, fieldName: string): string | null {
    const errors = fieldErrors[fieldName];

    if (!errors || errors.length === 0) {
        return null;
    }

    return errors[0] ?? null;
}

export default function AuthRegisterForm() {
    const [state, formAction, pending] = useActionState(registerAction, registerInitialState);

    return (
        <form action={formAction} className="grid gap-6">
            {state.formError && <div className="brutal-alert-error text-sm">{state.formError}</div>}

            {state.success && state.message.length > 0 && <div className="brutal-alert-success text-sm">{state.message}</div>}

            <div className="grid gap-2">
                <label htmlFor="email" className="brutal-label">
                    Email Kampus
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    disabled={pending}
                    className="brutal-input"
                    placeholder="nama@kampus.ac.id"
                />
                {getFieldError(state.fieldErrors, "email") && (
                    <p className="text-sm font-semibold text-[var(--tm-danger)]">{getFieldError(state.fieldErrors, "email")}</p>
                )}
            </div>

            <div className="grid gap-2">
                <label htmlFor="password" className="brutal-label">
                    Password
                </label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    disabled={pending}
                    className="brutal-input"
                    placeholder="Minimal 8 karakter"
                />
                {getFieldError(state.fieldErrors, "password") && (
                    <p className="text-sm font-semibold text-[var(--tm-danger)]">
                        {getFieldError(state.fieldErrors, "password")}
                    </p>
                )}
            </div>

            <div className="grid gap-2">
                <label htmlFor="confirm_password" className="brutal-label">
                    Konfirmasi Password
                </label>
                <input
                    id="confirm_password"
                    name="confirm_password"
                    type="password"
                    required
                    disabled={pending}
                    className="brutal-input"
                    placeholder="Ulangi password Anda"
                />
                {getFieldError(state.fieldErrors, "confirm_password") && (
                    <p className="text-sm font-semibold text-[var(--tm-danger)]">
                        {getFieldError(state.fieldErrors, "confirm_password")}
                    </p>
                )}
            </div>

            <button type="submit" disabled={pending} className="brutal-button mt-2 w-full">
                {pending ? "Sedang menyiapkan akun..." : "Daftar dan masuk"}
            </button>
        </form>
    );
}
