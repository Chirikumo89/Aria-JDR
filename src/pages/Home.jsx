export default function Home() {
    return (
      <div className="flex flex-col items-center justify-center text-center mt-24 min-h-screen bg-primary">
        <h1 className="text-4xl font-bold mb-4 text-primary">Bienvenue sur Aria JDR</h1>
        <p className="text-lg text-secondary max-w-xl">
          Ce site accompagne votre campagne sur le monde d'Aria ✨.
          Vous pourrez y gérer vos fiches de personnage, inventaires et lancers de dés
          en temps réel avec vos amis.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <a
            href="/games"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition-colors duration-200"
          >
            🎮 Gérer les parties
          </a>
          <a
            href="/des"
            className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 transition-colors duration-200"
          >
            🎲 Faire un lancer de dés
          </a>
        </div>
      </div>
    );
  }
  