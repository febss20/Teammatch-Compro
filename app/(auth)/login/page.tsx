import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AuthLoginForm from "@/components/auth/AuthLoginForm";
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
        <div className="min-h-screen px-4 py-10 md:py-14">
            <div className="page-frame grid gap-8 lg:grid-cols-[1fr_0.88fr] lg:items-stretch">
                <section className="grid gap-6">
                    <div className="section-kicker w-fit">Masuk ke akun</div>
                    <div className="brutal-panel bg-[var(--tm-line)] p-6 text-[var(--tm-paper-strong)] md:p-8">
                        <p className="display-font text-[clamp(4.2rem,10vw,7.5rem)] leading-[0.88]">
                            MASUK
                            <br />
                            KE
                            <br />
                            DASHBOARD
                        </p>
                        <p className="mt-5 max-w-2xl text-lg leading-8 text-[#f7eeda]">
                            Dashboard TeamMatch membantu Anda menyusun, memperbarui, dan mengelola board ide lomba dalam satu
                            tempat yang lebih rapi.
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="brutal-panel bg-[var(--tm-accent-2)] p-5">
                            <p className="display-font text-3xl leading-none">Ruang privat</p>
                            <p className="mt-3 text-sm leading-7 text-[var(--tm-line)]">
                                Semua board tersimpan di akun Anda dan hanya bisa diakses oleh pemiliknya.
                            </p>
                        </div>
                        <div className="brutal-panel p-5">
                            <p className="display-font text-3xl leading-none">Akses terarah</p>
                            <p className="mt-3 text-sm leading-7 text-[var(--tm-muted)]">
                                Akses ini membantu memastikan setiap ide punya pemilik yang jelas dan lebih mudah dikelola.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="brutal-stack">
                    <div className="brutal-panel h-full bg-[var(--tm-paper-strong)] p-6 md:p-8">
                        <div className="mb-8 space-y-3">
                            <p className="display-font text-3xl leading-none">Masuk ke akun Anda</p>
                            <p className="text-base leading-7 text-[var(--tm-muted)]">
                                Gunakan email dan password Anda untuk membuka dashboard ide lomba.
                            </p>
                        </div>

                        <AuthLoginForm nextPath={nextPath} />

                        <div className="mt-8 border-t-[3px] border-dashed border-[var(--tm-line)] pt-6 text-sm text-[var(--tm-muted)]">
                            Belum punya akun?{" "}
                            <Link href="/register" className="display-font text-2xl leading-none text-[var(--tm-line)]">
                                Daftar di TeamMatch
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
