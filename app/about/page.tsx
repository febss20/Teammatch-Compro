export default function AboutPage() {
  return (
    <div className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-primary font-semibold tracking-wide uppercase">Tentang Kami</h2>
        <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          Mendorong Prestasi Melalui Kolaborasi
        </p>
        <div className="mt-10 text-lg text-gray-500 text-left space-y-6">
          <p>
            TeamMatch lahir dari keresahan mahasiswa yang seringkali memiliki ide cemerlang untuk mengikuti lomba, namun sulit menemukan rekan tim yang tepat di lingkungan kampus.
          </p>
          <p>
            Kami percaya bahwa setiap mahasiswa memiliki potensi unik. Dengan platform ini, kami ingin meruntuhkan sekat antar fakultas dan jurusan agar kolaborasi multidisiplin dapat terjalin dengan lebih mudah.
          </p>
        </div>

        <div className="mt-16 bg-secondary/10 p-10 rounded-3xl border border-secondary/20">
          <h3 className="text-2xl font-bold text-secondary mb-4">Visi Kami</h3>
          <p className="italic text-gray-700">
            "Menjadi platform nomor satu bagi mahasiswa untuk membangun tim impian dan mencetak prestasi di setiap kompetisi."
          </p>
        </div>
      </div>
    </div>
  );
}