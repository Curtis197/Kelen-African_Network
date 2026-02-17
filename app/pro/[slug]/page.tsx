import Link from "next/link";

// This is a placeholder component. We'll add more logic later.
function StatusBadge({ status }: { status: string }) {
    let colorClass = "bg-gray-200 text-gray-800";
    switch (status) {
        case "Liste Or":
            colorClass = "bg-yellow-400 text-yellow-900";
            break;
        case "Liste Argent":
            colorClass = "bg-gray-300 text-gray-900";
            break;
        case "Liste Rouge":
            colorClass = "bg-red-500 text-white";
            break;
        case "Liste Noire":
            colorClass = "bg-black text-white";
            break;
    }
    return <span className={`px-2 py-1 text-sm font-semibold rounded-full ${colorClass}`}>{status}</span>;
}

// Placeholder data - In a real app, this would be fetched from a database
const professional = {
  name: "Mamadou Koné",
  slug: "mamadou-kone",
  status: "Liste Or",
  category: "Construction",
  location: "Abidjan, Côte d'Ivoire",
  description: "Artisan maçon avec 15 ans d'expérience dans la construction de résidences privées et de bâtiments commerciaux. Mon engagement est de livrer un travail de qualité, dans le respect des délais et du budget.",
  recommendations: [
    {
      id: 1,
      projectName: "Villa à Cocody",
      clientName: "A. Traoré",
      date: "2023-10-15",
      comment: "Excellent travail, très professionnel et à l'écoute. Je recommande vivement.",
    },
    {
      id: 2,
      projectName: "Immeuble R+3 à Marcory",
      clientName: "K. Diop",
      date: "2022-05-20",
      comment: "Mamadou et son équipe ont fait un travail remarquable. Le chantier a été livré en avance.",
    }
  ],
  signals: [],
  portfolio: [
    { id: 1, title: "Résidence Moderne" },
    { id: 2, title: "Boutique Chic" }
  ]
};

export default function ProfessionalProfilePage({ params }: { params: { slug: string } }) {
  // In a real app, you would fetch professional data based on params.slug

  return (
    <div className="flex flex-col min-h-screen bg-white">
       <header className="px-4 lg:px-6 h-14 flex items-center bg-white shadow-md">
        <Link className="flex items-center justify-center" href="/">
          <span className="text-xl font-bold" style={{ color: 'var(--primary-green)' }}>Kelen</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/recherche">
            Vérifier un professionnel
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/pour-les-pros">
            Pour les professionnels
          </Link>
        </nav>
      </header>

      <main className="flex-1 py-12 md:py-16">
        <div className="container px-4 md:px-6 mx-auto">
          {/* Professional Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold" style={{color: 'var(--primary-green)'}}>{professional.name}</h1>
              <div className="flex items-center gap-4 mt-2 text-gray-600">
                <span>{professional.category}</span>
                <span>{professional.location}</span>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
                <StatusBadge status={professional.status} />
            </div>
          </div>

          {/* About Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">À propos</h2>
            <p className="text-gray-700 leading-relaxed">{professional.description}</p>
          </div>

          {/* Portfolio Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Portfolio</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {professional.portfolio.map((item) => (
                <div key={item.id} className="border rounded-lg overflow-hidden">
                    <div className="w-full h-48 bg-gray-200 animate-pulse"></div>
                    <div className="p-4">
                        <h3 className="font-semibold">{item.title}</h3>
                    </div>
                </div>
              ))}
            </div>
          </div>

          {/* Track Record Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Historique vérifié</h2>
            <div className="space-y-6">
                {/* Recommendations */}
                {professional.recommendations.map((rec) => (
                    <div key={rec.id} className="border-l-4 border-green-500 pl-4 py-2">
                        <p className="font-semibold text-lg">{rec.projectName}</p>
                        <p className="text-gray-700 my-1">"{rec.comment}"</p>
                        <p className="text-sm text-gray-500">- {rec.clientName}, {rec.date}</p>
                    </div>
                ))}
                 {/* Signals - shown conditionally */}
                {professional.signals.length === 0 && (
                    <div className="border-l-4 border-gray-300 pl-4 py-2">
                         <p className="text-gray-600">Aucun signalement enregistré.</p>
                    </div>
                )}
            </div>
          </div>

        </div>
      </main>

      <footer className="flex items-center justify-center w-full h-24 border-t bg-white">
        <p className="text-gray-500">© 2024 Kelen. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
