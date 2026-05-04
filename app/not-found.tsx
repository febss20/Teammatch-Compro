import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="text-center px-4">
                <h1 className="text-8xl font-extrabold text-primary mb-4">404</h1>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Halaman Tidak Ditemukan</h2>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    Maaf, halaman yang Anda cari tidak ditemukan. Mungkin halaman telah dipindahkan atau URL yang Anda masukkan
                    salah.
                </p>
                <Link
                    href="/"
                    className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-full font-medium transition-colors inline-block"
                >
                    Kembali ke Beranda
                </Link>
            </div>
        </div>
    );
}
