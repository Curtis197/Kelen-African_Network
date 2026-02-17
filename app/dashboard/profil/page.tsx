export default function ProfilePage() {
  // Placeholder data
  const profile = {
    fullName: "Mamadou Koné",
    email: "mamadou.kone@example.com",
    category: "Construction",
    location: "Abidjan, Côte d'Ivoire",
    description: "Artisan maçon avec 15 ans d'expérience..."
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Mon Profil</h1>
      <div className="p-8 bg-white border rounded-lg shadow-sm">
        <form className="space-y-6">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Nom complet ou nom de l'entreprise</label>
            <input type="text" id="fullName" defaultValue={profile.fullName} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Adresse e-mail</label>
            <input type="email" id="email" defaultValue={profile.email} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">Catégorie</label>
            <select id="category" defaultValue={profile.category} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm">
              <option>Construction</option>
              <option>Rénovation</option>
              <option>Plomberie</option>
              <option>Électricité</option>
            </select>
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">Localisation</label>
            <input type="text" id="location" defaultValue={profile.location} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea id="description" rows={4} defaultValue={profile.description} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"></textarea>
          </div>
          <div className="text-right">
            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );
}
