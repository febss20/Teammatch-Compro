import Link from "next/link";
import { COMPETITIONS } from "@/lib/data";

export default function ServicesPage() {
  return (
    <div className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900">Kategori Lomba</h1>
          <p className="text-gray-500 mt-4">Pilih kategori kompetisi yang sesuai dengan minat Anda.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {COMPETITIONS.map((item) => (
            <div key={item.id} className="group border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all">
              <div className="h-48 bg-gray-200 relative">
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 mb-6 line-clamp-2">{item.description}</p>
                <Link 
                  href={`/services/${item.id}`}
                  className="text-secondary font-semibold hover:text-secondary-dark inline-flex items-center"
                >
                  Lihat Detail 
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}