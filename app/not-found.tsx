import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-screen px-4 py-10">
            <div className="page-frame flex min-h-[70vh] items-center justify-center">
                <div className="brutal-stack max-w-3xl">
                    <div className="brutal-panel grid gap-6 bg-[var(--tm-paper-strong)] p-8 text-center md:p-10">
                        <div className="mx-auto section-kicker">404</div>
                        <h1 className="display-font text-[6rem] leading-[0.82] md:text-[8rem]">HALAMAN TIDAK DITEMUKAN</h1>
                        <p className="mx-auto max-w-xl text-base leading-8 text-[var(--tm-muted)]">
                            Halaman yang Anda cari tidak ditemukan. Bisa jadi URL berubah, halaman dipindahkan, atau Anda masuk
                            ke rute yang memang belum ada.
                        </p>
                        <Link href="/" className="brutal-button mx-auto">
                            Kembali ke Beranda
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
