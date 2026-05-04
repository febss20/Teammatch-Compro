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
        <div className="min-h-screen px-4 py-10 md:py-14">
            <div className="page-frame grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
                <section className="grid gap-6">
                    <div className="section-kicker w-fit">Register Flow</div>
                    <div className="brutal-panel bg-[var(--tm-accent)] p-6 md:p-8">
                        <p className="display-font text-[clamp(4.2rem,10vw,7.4rem)] leading-[0.88] text-[var(--tm-line)]">
                            BUILD
                            <br />
                            YOUR
                            <br />
                            BOARD PASS
                        </p>
                        <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--tm-line)]">
                            Buat akun untuk mengubah ide lomba menjadi workspace yang bisa dikelola, diperbarui, dan dipoles
                            dengan ritme kerja yang lebih disiplin.
                        </p>
                    </div>

                    <div className="grid gap-4">
                        {[
                            "Akses board ide secara privat dan terproteksi.",
                            "Kelola create, edit, delete, dan status board dari satu dashboard.",
                            "Bangun jejak kolaborasi yang lebih siap dikembangkan menjadi platform matching berikutnya.",
                        ].map((item) => (
                            <div key={item} className="brutal-panel p-5">
                                <p className="display-font text-2xl leading-none">Feature Note</p>
                                <p className="mt-3 text-sm leading-7 text-[var(--tm-muted)]">{item}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="brutal-stack">
                    <div className="brutal-panel h-full bg-[var(--tm-paper-strong)] p-6 md:p-8">
                        <div className="mb-8 space-y-3">
                            <p className="display-font text-3xl leading-none">Buat akun baru</p>
                            <p className="text-base leading-7 text-[var(--tm-muted)]">
                                Setelah register berhasil, TeamMatch akan langsung mencoba membuat sesi login dan mengarahkan
                                Anda ke dashboard.
                            </p>
                        </div>

                        <AuthRegisterForm />

                        <div className="mt-8 border-t-[3px] border-dashed border-[var(--tm-line)] pt-6 text-sm text-[var(--tm-muted)]">
                            Sudah punya akun?{" "}
                            <Link href="/login" className="display-font text-2xl leading-none text-[var(--tm-line)]">
                                Masuk sekarang
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
