export default function DashboardPage() {
  // Placeholder data - In a real app, this would be fetched from the database
  const stats = {
    profileViews: 1250,
    recommendations: 12,
    currentStatus: "Liste Or"
  };

  return (
    <div>
        <h1 className="text-3xl font-bold mb-6">Tableau de bord</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Profile Views */}
            <div className="p-6 bg-white border rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold text-gray-700">Vues de profil (30j)</h2>
                <p className="text-4xl font-bold mt-2" style={{color: 'var(--primary-green)'}}>{stats.profileViews}</p>
            </div>

            {/* Recommendations */}
            <div className="p-6 bg-white border rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold text-gray-700">Recommandations</h2>
                <p className="text-4xl font-bold mt-2" style={{color: 'var(--primary-green)'}}>{stats.recommendations}</p>
            </div>

            {/* Current Status */}
            <div className="p-6 bg-white border rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold text-gray-700">Statut Actuel</h2>
                 <p className="text-4xl font-bold mt-2 text-yellow-500">{stats.currentStatus}</p>
            </div>
        </div>

        <div className="mt-8 bg-white border rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">Activité Récente</h2>
            <div className="text-gray-600">
                <p>Nouvelle recommandation de <span className="font-semibold">A. Traoré</span> pour le projet <span className="italic">"Villa à Cocody"</span>.</p>
                 <p className="mt-2">Votre profil a été vu par 50 nouveaux clients cette semaine.</p>
            </div>
        </div>
    </div>
  );
}
