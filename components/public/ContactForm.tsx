"use client";

import { useState } from "react";

interface ContactErrorResponse {
    error?: string;
}

export default function ContactForm() {
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: "", email: "", message: "" });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        setStatus("loading");

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const errorResponse = (await res.json()) as ContactErrorResponse;
                setErrorMessage(errorResponse.error ?? "Gagal mengirim pesan. Silakan coba lagi.");
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
            </div>

            {status === "error" && errorMessage && <p className="brutal-alert-error text-sm">{errorMessage}</p>}

            <button disabled={status === "loading"} type="submit" className="brutal-button w-full">
                {status === "loading" ? "Mengirim..." : "Kirim pesan"}
            </button>
        </form>
    );
}
