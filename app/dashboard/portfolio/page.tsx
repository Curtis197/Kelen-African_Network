export default function PortfolioPage() {
  // Placeholder data
  const portfolioItems = [
    { id: 1, title: "Résidence Moderne", imageUrl: "" },
    { id: 2, title: "Boutique Chic", imageUrl: "" },
    { id: 3, title: "Immeuble de bureaux", imageUrl: "" }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Mon Portfolio</h1>
        <button className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">Ajouter un projet</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {portfolioItems.map((item) => (
          <div key={item.id} className="border rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="w-full h-48 bg-gray-200 animate-pulse"></div>
            <div className="p-4 flex justify-between items-center">
                <h3 className="font-semibold">{item.title}</h3>
                <button className="text-red-500 hover:text-red-700">Supprimer</button>
            </div>
          </div>
        ))}
      </div>
       {/* Add Project Modal (placeholder) */}
    </div>
  );
}
