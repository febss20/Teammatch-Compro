import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AuthLoginForm from "@/components/AuthLoginForm";
import { getCurrentUser, sanitizeNextPath } from "@/lib/auth";

export const metadata: Metadata = {
    title: "Login | TeamMatch",
    description: "Masuk ke dashboard TeamMatch untuk mengelola board ide lomba Anda.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
    const user = await getCurrentUser();

    if (user) {
        redirect("/dashboard");
    }

    const resolvedSearchParams = await searchParams;
    const nextPath = sanitizeNextPath(resolvedSearchParams.next);

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(6,182,212,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(20,184,166,0.18),_transparent_24%),linear-gradient(180deg,_#f8fafc_0%,_#ecfeff_100%)] px-4 py-20">
            <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_0.92fr] lg:items-center">
                <section className="space-y-8">
                    <div className="inline-flex rounded-full border border-cyan-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-700">
                        TeamMatch Dashboard
                    </div>
                    <div className="space-y-5">
                        <h1 className="max-w-3xl text-5xl font-black tracking-tight text-gray-900 md:text-6xl">
                            Masuk dan kelola board ide lomba Anda dari satu dashboard.
                        </h1>
                        <p className="max-w-2xl text-lg leading-8 text-gray-600">
                            TeamMatch tidak lagi berhenti di landing page. Begitu Anda masuk, setiap ide lomba menjadi aset yang
                            bisa diperbarui, ditutup, atau dikembangkan bersama rekan tim yang tepat.
                        </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-[1.75rem] border border-white/80 bg-white/80 p-6 shadow-lg backdrop-blur">
                            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-700">
                                Protected Workspace
                            </p>
                            <p className="mt-3 text-sm leading-7 text-gray-600">
                                Semua board ide kini berada di ruang kerja privat yang hanya dapat diakses pemilik akun.
                            </p>
                        </div>
                        <div className="rounded-[1.75rem] border border-white/80 bg-gray-900 p-6 text-white shadow-lg">
                            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">Auth First</p>
                            <p className="mt-3 text-sm leading-7 text-gray-300">
                                Login diperlukan agar setiap board punya ownership yang jelas dan bisa dikelola aman.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="rounded-[2rem] border border-white/80 bg-white/92 p-8 shadow-[0_35px_120px_rgba(6,182,212,0.18)] backdrop-blur md:p-10">
                    <div className="mb-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">Login</p>
                        <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-900">Masuk ke akun Anda</h2>
                        <p className="mt-3 text-sm leading-7 text-gray-600">
                            Gunakan email kampus dan password Anda untuk mengakses dashboard board ide.
                        </p>
                    </div>

                    <AuthLoginForm nextPath={nextPath} />

                    <div className="mt-8 border-t border-gray-100 pt-6 text-sm text-gray-600">
                        Belum punya akun?{" "}
                        <Link href="/register" className="font-semibold text-cyan-700 hover:text-cyan-800">
                            Buat akun TeamMatch
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
