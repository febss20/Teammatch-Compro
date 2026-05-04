import Link from "next/link";

const FOOTER_LINKS = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/login?next=/dashboard/boards/new", label: "Post Idea" },
    { href: "/services", label: "Services" },
    { href: "/gallery", label: "Gallery" },
    { href: "/contact", label: "Contact" },
    { href: "/register", label: "Register" },
];

export default function Footer() {
    return (
        <footer className="px-4 pb-8 pt-16">
            <div className="page-frame brutal-panel overflow-hidden bg-[var(--tm-line)] text-[var(--tm-paper-strong)]">
                <div className="grid gap-10 px-6 py-8 md:px-8 lg:grid-cols-[1.15fr_0.7fr_0.7fr] lg:px-10 lg:py-10">
                    <div className="space-y-5">
                        <div className="inline-flex rotate-[-2deg] border-[3px] border-[var(--tm-paper-strong)] bg-[var(--tm-accent)] px-4 py-2 display-font text-2xl leading-none text-[var(--tm-line)]">
                            TeamMatch
                        </div>
                        <p className="max-w-xl text-base leading-7 text-[#f7eeda]">
                            Platform kolaborasi mahasiswa untuk mengubah ide lomba menjadi board yang jelas, tajam, dan siap
                            mengundang rekan tim yang tepat.
                        </p>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-[18px] border-[3px] border-[var(--tm-paper-strong)] bg-[var(--tm-accent-3)] px-4 py-3">
                                <p className="display-font text-xl text-white">SPORT-TECH</p>
                            </div>
                            <div className="rounded-[18px] border-[3px] border-[var(--tm-paper-strong)] bg-[var(--tm-accent-2)] px-4 py-3 text-[var(--tm-line)]">
                                <p className="display-font text-xl">BOARD FIRST</p>
                            </div>
                            <div className="rounded-[18px] border-[3px] border-[var(--tm-paper-strong)] bg-[var(--tm-paper-strong)] px-4 py-3 text-[var(--tm-line)]">
                                <p className="display-font text-xl">CAMPUS MVP</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="display-font text-2xl uppercase">Navigate</p>
                        <ul className="grid gap-3">
                            {FOOTER_LINKS.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="inline-flex rounded-full border-[2px] border-[var(--tm-paper-strong)] px-4 py-2 text-sm font-semibold uppercase tracking-[0.14em] text-[#f7eeda] hover:bg-[var(--tm-paper-strong)] hover:text-[var(--tm-line)]"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <p className="display-font text-2xl uppercase">Contact Desk</p>
                        <div className="grid gap-3 text-sm text-[#f7eeda]">
                            <div className="rounded-[18px] border-[3px] border-[var(--tm-paper-strong)] bg-transparent px-4 py-3">
                                <p className="display-font text-lg text-white">Location</p>
                                <p className="mt-2 leading-6">Gedung Sekretariat Mahasiswa, Lt. 2</p>
                            </div>
                            <div className="rounded-[18px] border-[3px] border-[var(--tm-paper-strong)] bg-transparent px-4 py-3">
                                <p className="display-font text-lg text-white">Email</p>
                                <p className="mt-2 leading-6">support@teammatch.ac.id</p>
                            </div>
                            <div className="rounded-[18px] border-[3px] border-[var(--tm-paper-strong)] bg-transparent px-4 py-3">
                                <p className="display-font text-lg text-white">Web</p>
                                <p className="mt-2 leading-6">www.teammatch.ac.id</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t-[3px] border-dashed border-[#f7eeda] px-6 py-5 text-sm uppercase tracking-[0.22em] text-[#f7eeda] md:px-10">
                    © {new Date().getFullYear()} TeamMatch. Connecting ambitious campus builders.
                </div>
            </div>
        </footer>
    );
}
