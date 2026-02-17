import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white shadow-md">
        <div className="px-4 py-6">
          <Link href="/">
             <span className="text-2xl font-bold" style={{ color: 'var(--primary-green)' }}>Kelen</span>
          </Link>
          <nav className="mt-8">
            <Link
              className="flex items-center px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100"
              href="/dashboard"
            >
              Tableau de bord
            </Link>
            <Link
              className="flex items-center px-4 py-2 mt-2 text-gray-700 rounded-md hover:bg-gray-100"
              href="/dashboard/profil"
            >
              Mon Profil
            </Link>
            <Link
              className="flex items-center px-4 py-2 mt-2 text-gray-700 rounded-md hover:bg-gray-100"
              href="/dashboard/portfolio"
            >
              Portfolio
            </Link>
             <Link
              className="flex items-center px-4 py-2 mt-2 text-gray-700 rounded-md hover:bg-gray-100"
              href="/dashboard/reputation"
            >
              Réputation
            </Link>
          </nav>
        </div>
      </aside>
      <div className="flex-1">
        <header className="bg-white shadow-sm">
            <div className="flex items-center justify-between px-4 py-3">
                <h1 className="text-xl font-semibold"></h1>
                 {/* In a real app, this would show user info */}
                <div className="text-sm font-semibold">Mamadou Koné</div>
            </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
