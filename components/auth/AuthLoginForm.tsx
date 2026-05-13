"use client";

import { useActionState, useState } from "react";
import { loginAction } from "@/app/(auth)/login/actions";
import { loginWithGoogleAction } from "@/app/(auth)/oauth/actions";
import { campusEmailMessage, isCampusEmail } from "@/lib/auth/email";
import { loginInitialState } from "@/lib/forms";
import { getStringFormValue } from "@/lib/shared/form-values";
import PendingSubmitButton from "@/components/shared/PendingSubmitButton";

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
    const [emailError, setEmailError] = useState<string | null>(null);

    function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
        const formData = new FormData(event.currentTarget);
        const email = formData.get("email");

        if (typeof email === "string" && !isCampusEmail(email)) {
            event.preventDefault();
            setEmailError(campusEmailMessage);
            return;
        }

        setEmailError(null);
    }

    return (
        <div className="grid gap-6">
            <form action={formAction} onSubmit={handleSubmit} className="grid gap-6">
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
                        inputMode="email"
                        required
                        disabled={pending}
                        defaultValue={getStringFormValue(state.values, "email") ?? ""}
                        className="brutal-input"
                        placeholder="nama@kampus.ac.id"
                        onChange={() => setEmailError(null)}
                    />
                    <p className="text-sm text-[var(--tm-muted)]">Gunakan domain kampus .ac.id atau .edu.</p>
                    {(emailError || getFieldError(state.fieldErrors, "email")) && (
                        <p className="text-sm font-semibold text-[var(--tm-danger)]">
                            {emailError ?? getFieldError(state.fieldErrors, "email")}
                        </p>
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

            <form action={loginWithGoogleAction}>
                <input type="hidden" name="next" value={nextPath} />
                <PendingSubmitButton
                    className="brutal-button-secondary w-full"
                    idleLabel="Masuk dengan Google kampus"
                    pendingLabel="Mengarahkan ke Google..."
                />
            </form>
        </div>
    );
}
