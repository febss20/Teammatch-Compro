import { COMPETITIONS } from "@/lib/data";
import { notFound } from "next/navigation";
import Link from "next/link";

export default function ServiceDetailPage({ params }: { params: { id: string } }) {
  const data = COMPETITIONS.find((item) => item.id === params.id);

  if (!data) {
    notFound();
  }

  return (
    <div className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/services" className="text-primary hover:underline mb-8 inline-block">
          ← Kembali ke daftar
        </Link>
        
        <div className="rounded-3xl overflow-hidden h-64 md:h-96 mb-8">
          <img src={data.image} alt={data.title} className="w-full h-full object-cover" />
        </div>

        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">{data.title}</h1>
        <div className="prose max-w-none text-gray-600 space-y-4 text-lg leading-relaxed">
          <p>{data.description}</p>
          <p>
            Di kategori {data.title}, Anda akan menemukan banyak mahasiswa yang mencari rekan tim untuk berkolaborasi. 
            Pastikan portofolio Anda sudah lengkap sebelum menghubungi calon rekan tim.
          </p>
        </div>

        <div className="mt-12 p-8 bg-primary/5 rounded-2xl border border-primary/10">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ingin bergabung di kategori ini?</h2>
          <p className="text-gray-600 mb-4">Mulai bangun tim impian Anda sekarang juga.</p>
          <button className="bg-primary text-white px-6 py-2 rounded-lg font-medium">
            Posting Lowongan Tim
          </button>
        </div>
      </div>
    </div>
  );
}