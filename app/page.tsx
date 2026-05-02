import Hero from "@/components/Hero";

export default function HomePage() {
    return (
        <div>
            <Hero />

            <section className="py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
                        <div className="text-primary text-3xl mb-4 font-bold">01</div>
                        <h3 className="text-xl font-bold mb-2">Cari Kompetisi</h3>
                        <p className="text-gray-500">Akses daftar lomba aktif dari berbagai bidang minat.</p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
                        <div className="text-secondary text-3xl mb-4 font-bold">02</div>
                        <h3 className="text-xl font-bold mb-2">Filter Skill</h3>
                        <p className="text-gray-500">Cari teman tim berdasarkan keahlian spesifik yang dibutuhkan.</p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
                        <div className="text-primary text-3xl mb-4 font-bold">03</div>
                        <h3 className="text-xl font-bold mb-2">Mulai Kolaborasi</h3>
                        <p className="text-gray-500">Hubungi calon rekan setim dan mulai kerjakan project bersama.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
