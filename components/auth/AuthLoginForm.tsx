"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/(auth)/login/actions";
import { loginInitialState } from "@/lib/forms";

interface AuthLoginFormProps {
    nextPath: string;
}

function getFieldError(fieldErrors: Partial<Record<string, string[]>>, fieldName: string): string | null {
    const errors = fieldErrors[fieldName];

    if (!errors || errors.length === 0) {
        return null;
    }

    return errors[0] ?? null;
}

export default function AuthLoginForm({ nextPath }: AuthLoginFormProps) {
    const [state, formAction, pending] = useActionState(loginAction, loginInitialState);

    return (
        <form action={formAction} className="grid gap-6">
            <input type="hidden" name="next" value={nextPath} />

            {state.formError && <div className="brutal-alert-error text-sm">{state.formError}</div>}

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

            <button type="submit" disabled={pending} className="brutal-button mt-2 w-full">
                {pending ? "Sedang memeriksa akun..." : "Masuk ke dashboard"}
            </button>
        </form>
    );
}
