import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
    title: "Hubungi Kami | TeamMatch",
    description: "Punya pertanyaan tentang TeamMatch? Hubungi tim kami untuk informasi lebih lanjut.",
};

export default function ContactPage() {
    return (
        <div className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-16">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-6">Hubungi Kami</h1>
                    <p className="text-lg text-gray-600 mb-8">
                        Punya pertanyaan mengenai platform TeamMatch atau ingin bekerja sama sebagai penyelenggara lomba? Tim
                        kami siap membantu Anda.
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                            <span className="text-primary mr-4">📍</span>
                            <span className="text-gray-700">Gedung Sekretariat Mahasiswa, Lt. 2</span>
                        </div>
                        <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                            <span className="text-primary mr-4">✉️</span>
                            <span className="text-gray-700">support@teammatch.ac.id</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-100 shadow-xl p-8 rounded-3xl">
                    <ContactForm />
                </div>
            </div>
        </div>
    );
}
