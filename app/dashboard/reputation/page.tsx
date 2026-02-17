export default function ReputationPage() {
  // Placeholder data
  const recommendations = [
    {
      id: 1,
      projectName: "Villa à Cocody",
      clientName: "A. Traoré",
      date: "2023-10-15",
      comment: "Excellent travail, très professionnel et à l'écoute. Je recommande vivement.",
      status: "Vérifiée"
    },
     {
      id: 2,
      projectName: "Immeuble R+3 à Marcory",
      clientName: "K. Diop",
      date: "2022-05-20",
      comment: "Mamadou et son équipe ont fait un travail remarquable. Le chantier a été livré en avance.",
      status: "Vérifiée"
    }
  ];

  const signals = [
      { id: 1, reason: "Retard de livraison", date: "2023-01-10", reporter: "Anonyme" }
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Ma Réputation</h1>

      {/* Recommendations Section */}
      <div className="bg-white border rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Recommandations des clients</h2>
         <div className="space-y-6">
              {recommendations.map((rec) => (
                  <div key={rec.id} className="border-l-4 border-green-500 pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <div>
                            <p className="font-semibold text-lg">{rec.projectName}</p>
                            <p className="text-gray-700 my-1">"{rec.comment}"</p>
                            <p className="text-sm text-gray-500">- {rec.clientName}, {rec.date}</p>
                        </div>
                         <span className="text-sm font-semibold text-green-600">{rec.status}</span>
                      </div>
                  </div>
              ))}
        </div>
      </div>

      {/* Signals Section */}
       <div className="bg-white border rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold mb-4 text-red-600">Signalements</h2>
        <div className="space-y-4">
          {signals.length > 0 ? (
            signals.map((signal) => (
              <div key={signal.id} className="border-l-4 border-red-500 pl-4 py-2">
                 <p className="font-semibold">{signal.reason}</p>
                 <p className="text-sm text-gray-500">Signalé le {signal.date} par {signal.reporter}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">Aucun signalement enregistré.</p>
          )}
        </div>
      </div>
    </div>
  );
}
