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
        <form action={formAction} className="space-y-6">
            {state.formError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {state.formError}
                </div>
            )}

            {state.success && state.message.length > 0 && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {state.message}
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

            <div className="space-y-2">
                <label htmlFor="confirm_password" className="block text-xs font-bold uppercase tracking-[0.28em] text-cyan-700">
                    Konfirmasi Password
                </label>
                <input
                    id="confirm_password"
                    name="confirm_password"
                    type="password"
                    required
                    disabled={pending}
                    className="w-full rounded-2xl border border-cyan-100 bg-white px-5 py-4 text-gray-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                    placeholder="Ulangi password Anda"
                />
                {getFieldError(state.fieldErrors, "confirm_password") && (
                    <p className="text-sm text-red-600">{getFieldError(state.fieldErrors, "confirm_password")}</p>
                )}
            </div>

            <button
                type="submit"
                disabled={pending}
                className="w-full rounded-full bg-gray-900 px-6 py-4 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {pending ? "Membuat Akun..." : "Buat Akun dan Masuk"}
            </button>
        </form>
    );
}
