"use client";

import Script from "next/script";
import { useState } from "react";

interface ContactErrorResponse {
    error?: string;
    fieldErrors?: Partial<Record<"email" | "message" | "name", string[]>>;
}

export default function ContactForm() {
    const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<"email" | "message" | "name", string[]>>>({});
    const [status, setStatus] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: "", email: "", message: "" });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const fieldName = e.target.name as "email" | "message" | "name";
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setFieldErrors((prev) => ({ ...prev, [fieldName]: undefined }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage(null);
        setFieldErrors({});
        setStatus("loading");

        try {
            const submittedFormData = new FormData(e.currentTarget);
            const turnstileToken = submittedFormData.get("cf-turnstile-response");
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    turnstileToken: typeof turnstileToken === "string" ? turnstileToken : "",
                }),
            });

            if (!res.ok) {
                const errorResponse = (await res.json()) as ContactErrorResponse;
                setErrorMessage(errorResponse.error ?? "Gagal mengirim pesan. Silakan coba lagi.");
                setFieldErrors(errorResponse.fieldErrors ?? {});
                setStatus("error");
                return;
            }

            setStatus("success");
            setFormData({ name: "", email: "", message: "" });
        } catch {
            setErrorMessage("Gagal mengirim pesan. Silakan coba lagi.");
            setStatus("error");
        }
    };

    if (status === "success") {
        return (
            <div className="brutal-panel bg-[var(--tm-accent-2)] p-6 text-center">
                <h3 className="display-font text-4xl leading-none text-[var(--tm-line)]">Pesan Terkirim</h3>
                <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-[var(--tm-line)]">
                    Terima kasih. Pesan Anda sudah kami terima dan akan segera kami tindak lanjuti.
                </p>
                <button onClick={() => setStatus(null)} className="brutal-button mt-6">
                    Kirim pesan lain
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="grid gap-5">
            {turnstileSiteKey && (
                <>
                    <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
                    <div className="cf-turnstile" data-sitekey={turnstileSiteKey} />
                </>
            )}
            <div className="grid gap-2">
                <label htmlFor="name" className="brutal-label">
                    Nama Lengkap
                </label>
                <input
                    id="name"
                    name="name"
                    required
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className="brutal-input"
                    placeholder="Tulis nama Anda"
                />
                {fieldErrors.name?.[0] && (
                    <p className="text-sm font-semibold text-[var(--tm-danger)]">{fieldErrors.name[0]}</p>
                )}
            </div>
            <div className="grid gap-2">
                <label htmlFor="email" className="brutal-label">
                    Email Kampus
                </label>
                <input
                    id="email"
                    name="email"
                    required
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="brutal-input"
                    placeholder="contoh@mahasiswa.ac.id"
                />
                {fieldErrors.email?.[0] && (
                    <p className="text-sm font-semibold text-[var(--tm-danger)]">{fieldErrors.email[0]}</p>
                )}
            </div>
            <div className="grid gap-2">
                <label htmlFor="message" className="brutal-label">
                    Pesan
                </label>
                <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    className="brutal-textarea"
                    placeholder="Tulis pesan Anda di sini"
                />
                {fieldErrors.message?.[0] && (
                    <p className="text-sm font-semibold text-[var(--tm-danger)]">{fieldErrors.message[0]}</p>
                )}
            </div>

            {status === "error" && errorMessage && <p className="brutal-alert-error text-sm">{errorMessage}</p>}

            <button disabled={status === "loading"} type="submit" className="brutal-button w-full">
                {status === "loading" ? "Mengirim..." : "Kirim pesan"}
            </button>
        </form>
    );
}
