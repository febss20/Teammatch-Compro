import Link from "next/link";

export default function Hero() {
    return (
        <section className="bg-white py-20 px-4">
            <div className="max-w-7xl mx-auto text-center">
                <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
                    Bangun Tim <span className="text-primary">Juara</span> Anda di Sini
                </h1>
                <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
                    Temukan rekan mahasiswa satu kampus yang memiliki visi dan skill yang sama untuk memenangkan berbagai
                    kompetisi tingkat nasional maupun internasional.
                </p>
                <div className="flex justify-center gap-4">
                    <Link
                        href="/services"
                        className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-full font-medium transition-all"
                    >
                        Cari Lomba
                    </Link>
                    <Link
                        href="/about"
                        className="border-2 border-secondary text-secondary hover:bg-secondary hover:text-white px-8 py-3 rounded-full font-medium transition-all"
                    >
                        Pelajari Lebih Lanjut
                    </Link>
                </div>
            </div>
        </section>
    );
}
