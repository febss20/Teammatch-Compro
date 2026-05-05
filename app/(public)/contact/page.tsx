import type { Metadata } from "next";
import ContactForm from "@/components/public/ContactForm";

export const metadata: Metadata = {
    title: "Hubungi Kami | TeamMatch",
    description: "Punya pertanyaan tentang TeamMatch? Hubungi tim kami untuk informasi lebih lanjut.",
};

export default function ContactPage() {
    return (
        <div className="px-4 py-12 md:py-16">
            <div className="page-frame grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
                <section className="space-y-6">
                    <div className="section-kicker">Hubungi kami</div>
                    <h1 className="display-font text-6xl leading-[0.9] md:text-7xl">MARI BICARA</h1>
                    <p className="max-w-xl text-lg leading-8 text-[var(--tm-muted)]">
                        Jika Anda punya pertanyaan, ingin menjalin kerja sama, atau butuh informasi lebih lanjut, kirim pesan
                        lewat halaman ini.
                    </p>

                    <div className="grid gap-4">
                        <div className="brutal-panel p-5">
                            <p className="display-font text-2xl leading-none">Alamat</p>
                            <p className="mt-3 text-base leading-7 text-[var(--tm-muted)]">
                                Gedung Sekretariat Mahasiswa, Lt. 2
                            </p>
                        </div>
                        <div className="brutal-panel bg-[var(--tm-accent-2)] p-5">
                            <p className="display-font text-2xl leading-none">Email</p>
                            <p className="mt-3 text-base leading-7 text-[var(--tm-line)]">support@teammatch.ac.id</p>
                        </div>
                    </div>
                </section>

                <section className="brutal-stack">
                    <div className="brutal-panel bg-[var(--tm-paper-strong)] p-6 md:p-8">
                        <div className="mb-6">
                            <p className="display-font text-3xl leading-none">Kirim pesan</p>
                            <p className="mt-3 text-base leading-7 text-[var(--tm-muted)]">
                                Sampaikan kebutuhan Anda secara singkat. Tim TeamMatch akan menindaklanjutinya secepat mungkin.
                            </p>
                        </div>
                        <ContactForm />
                    </div>
                </section>
            </div>
        </div>
    );
}
