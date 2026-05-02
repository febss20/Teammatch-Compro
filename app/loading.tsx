export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="inline-block w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-gray-500 text-sm">Memuat halaman...</p>
            </div>
        </div>
    );
}
