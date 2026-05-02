"use client";
import { useState } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    
    // Simulasi pengiriman pesan
    setTimeout(() => {
      setStatus("success");
    }, 1500);
  };

  if (status === "success") {
    return (
      <div className="bg-secondary/10 p-8 rounded-2xl text-center border border-secondary/20">
        <h3 className="text-2xl font-bold text-secondary mb-2">Pesan Terkirim!</h3>
        <p className="text-gray-600">Terima kasih telah menghubungi TeamMatch. Kami akan segera membalas pesan Anda.</p>
        <button 
          onClick={() => setStatus(null)}
          className="mt-6 text-primary font-semibold hover:underline"
        >
          Kirim pesan lain
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
        <input 
          required
          type="text" 
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
          placeholder="Masukkan nama Anda"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email Kampus</label>
        <input 
          required
          type="email" 
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
          placeholder="contoh@mahasiswa.ac.id"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Pesan</label>
        <textarea 
          required
          rows={4}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
          placeholder="Apa yang ingin Anda tanyakan?"
        ></textarea>
      </div>
      <button 
        disabled={status === "loading"}
        type="submit" 
        className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-lg transition-colors disabled:bg-gray-400"
      >
        {status === "loading" ? "Mengirim..." : "Kirim Pesan"}
      </button>
    </form>
  );
}