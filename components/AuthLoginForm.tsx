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
        <form action={formAction} className="space-y-6">
            <input type="hidden" name="next" value={nextPath} />

            {state.formError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {state.formError}
                </div>
            )}

            <div className="space-y-2">
                <label htmlFor="email" className="block text-xs font-bold uppercase tracking-[0.28em] text-cyan-700">
                    Email Kampus
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    disabled={pending}
                    className="w-full rounded-2xl border border-cyan-100 bg-white px-5 py-4 text-gray-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                    placeholder="nama@kampus.ac.id"
                />
                {getFieldError(state.fieldErrors, "email") && (
                    <p className="text-sm text-red-600">{getFieldError(state.fieldErrors, "email")}</p>
                )}
            </div>

            <div className="space-y-2">
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-[0.28em] text-cyan-700">
                    Password
                </label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    disabled={pending}
                    className="w-full rounded-2xl border border-cyan-100 bg-white px-5 py-4 text-gray-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                    placeholder="Minimal 8 karakter"
                />
                {getFieldError(state.fieldErrors, "password") && (
                    <p className="text-sm text-red-600">{getFieldError(state.fieldErrors, "password")}</p>
                )}
            </div>

            <button
                type="submit"
                disabled={pending}
                className="w-full rounded-full bg-gray-900 px-6 py-4 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {pending ? "Memproses Login..." : "Masuk ke Dashboard"}
            </button>
        </form>
    );
}
