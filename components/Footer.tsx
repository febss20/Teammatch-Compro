export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-2xl font-bold text-primary mb-4">TeamMatch</p>
        <p className="text-gray-400 text-sm">
          © {new Date().getFullYear()} TeamMatch. Menghubungkan Mahasiswa Berprestasi.
        </p>
      </div>
    </footer>
  );
}