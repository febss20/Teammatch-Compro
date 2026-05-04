import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AuthRegisterForm from "@/components/AuthRegisterForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
    title: "Register | TeamMatch",
    description: "Buat akun TeamMatch dan mulai membangun dashboard board ide lomba Anda.",
};

export default async function RegisterPage() {
    const user = await getCurrentUser();

    if (user) {
        redirect("/dashboard");
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(6,182,212,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(20,184,166,0.18),_transparent_24%),linear-gradient(180deg,_#f8fafc_0%,_#ecfeff_100%)] px-4 py-20">
            <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
                <section className="space-y-8">
                    <div className="inline-flex rounded-full border border-cyan-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-700">
                        Join TeamMatch
                    </div>
                    <div className="space-y-5">
                        <h1 className="max-w-3xl text-5xl font-black tracking-tight text-gray-900 md:text-6xl">
                            Buat akun dan ubah ide lomba menjadi workspace kolaborasi yang nyata.
                        </h1>
                        <p className="max-w-2xl text-lg leading-8 text-gray-600">
                            Dashboard TeamMatch dirancang untuk mahasiswa yang ingin menata ide kompetisi secara lebih serius,
                            lengkap dengan ownership, status board, dan histori pembaruan.
                        </p>
                    </div>
                    <div className="space-y-4">
                        {[
                            "Akses board ide secara privat dan terproteksi.",
                            "Kelola create, edit, delete, dan status board dari satu dashboard.",
                            "Bangun jejak kolaborasi yang lebih siap dikembangkan menjadi platform matching berikutnya.",
                        ].map((item) => (
                            <div
                                key={item}
                                className="flex items-start gap-4 rounded-[1.6rem] border border-white/80 bg-white/80 px-5 py-4 shadow-lg backdrop-blur"
                            >
                                <div className="mt-1 h-3 w-3 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500" />
                                <p className="text-sm leading-7 text-gray-700">{item}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="rounded-[2rem] border border-white/80 bg-white/92 p-8 shadow-[0_35px_120px_rgba(6,182,212,0.18)] backdrop-blur md:p-10">
                    <div className="mb-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">Register</p>
                        <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-900">Buat akun baru</h2>
                        <p className="mt-3 text-sm leading-7 text-gray-600">
                            Setelah register berhasil, TeamMatch akan langsung mencoba membuat sesi login dan mengarahkan Anda
                            ke dashboard.
                        </p>
                    </div>

                    <AuthRegisterForm />

                    <div className="mt-8 border-t border-gray-100 pt-6 text-sm text-gray-600">
                        Sudah punya akun?{" "}
                        <Link href="/login" className="font-semibold text-cyan-700 hover:text-cyan-800">
                            Masuk sekarang
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
