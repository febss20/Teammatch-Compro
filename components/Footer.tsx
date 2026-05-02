import Link from "next/link";

const FOOTER_LINKS = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/services", label: "Services" },
    { href: "/gallery", label: "Gallery" },
    { href: "/contact", label: "Contact" },
];

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-white py-16">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid md:grid-cols-3 gap-12 mb-12">
                    {/* Brand */}
                    <div>
                        <p className="text-2xl font-bold text-primary mb-4">TeamMatch</p>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Platform kolaborasi mahasiswa untuk menemukan rekan tim dan memenangkan berbagai kompetisi tingkat
                            nasional maupun internasional.
                        </p>
                    </div>

                    {/* Navigation */}
                    <div>
                        <h3 className="font-semibold text-lg mb-4">Navigasi</h3>
                        <ul className="space-y-2">
                            {FOOTER_LINKS.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-gray-400 hover:text-primary transition-colors text-sm"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact info */}
                    <div>
                        <h3 className="font-semibold text-lg mb-4">Kontak</h3>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li className="flex items-center gap-2">
                                <span>📍</span>
                                <span>Gedung Sekretariat Mahasiswa, Lt. 2</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span>✉️</span>
                                <span>support@teammatch.ac.id</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span>🌐</span>
                                <span>www.teammatch.ac.id</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-gray-800 pt-8 text-center">
                    <p className="text-gray-500 text-sm">
                        © {new Date().getFullYear()} TeamMatch. Menghubungkan Mahasiswa Berprestasi.
                    </p>
                </div>
            </div>
        </footer>
    );
}
