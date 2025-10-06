import { useDiceModal } from "../../context/DiceModalContext";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";

export default function DiceSelector3D() {
  const { open, hide } = useDiceModal();
  const socket = useSocket();
  const { user } = useAuth(); // Utiliser le contexte Auth au lieu du localStorage
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customNotation, setCustomNotation] = useState("");

  console.log("[DiceSelector3D] Render, open:", open);
  console.log("[DiceSelector3D] User depuis AuthContext:", user);

  if (!open) return null;

  const rollDice = (notation, type) => {
    console.log(`[DiceSelector3D] Lancement du dé : ${notation} (${type})`);
    console.log(`[DiceSelector3D] Socket disponible :`, !!socket);
    console.log(`[DiceSelector3D] Socket connecté :`, socket?.connected);
    
    if (!socket) {
      console.error("[DiceSelector3D] Socket non disponible !");
      return;
    }
    
    if (!socket.connected) {
      console.error("[DiceSelector3D] Socket non connecté !");
      return;
    }
    
    // Utiliser le user du contexte Auth (unique par onglet/connexion)
    const player = user?.name || user?.username || "MJ";
    const userId = user?.id;
    
    console.log(`[DiceSelector3D] 👤 Joueur depuis AuthContext: ${player} (ID: ${userId})`);
    console.log(`[DiceSelector3D] Envoi de dice:roll - Notation: ${notation}, Type: ${type}, Player: ${player}`);
    console.log(`[DiceSelector3D] 🆔 Session ID envoyé:`, window.diceSessionId);
    
    const dataToSend = { 
      notation, 
      type, 
      player,  // Nom du joueur depuis AuthContext
      sessionId: window.diceSessionId, // ID unique de la session
      userId: userId  // ID utilisateur depuis AuthContext
    };
    console.log(`[DiceSelector3D] 📦 Données complètes envoyées:`, JSON.stringify(dataToSend, null, 2));

    // Envoyer les données au serveur AVEC l'ID de session
    socket.emit("dice:roll", dataToSend);
    
    hide();
  };

  const handleCustomSubmit = () => {
    if (customNotation && customNotation.trim()) {
      // Valider la notation basique
      const diceRegex = /^(\d+)d(\d+)([+-]\d+)?$/;
      if (diceRegex.test(customNotation.trim())) {
        rollDice(customNotation.trim(), "custom");
        setCustomNotation("");
        setShowCustomInput(false);
      } else {
        alert("Notation invalide. Utilisez le format: XdY+Z (ex: 2d6+3, 1d4, 3d8-1)");
      }
    }
  };

  const handleCustomCancel = () => {
    setCustomNotation("");
    setShowCustomInput(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white rounded-2xl p-8 shadow-2xl w-full max-w-md border border-gray-700">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            🎲 Lancer les dés
          </h3>
          <p className="text-gray-400 text-sm">Choisissez votre dé ou saisissez une notation personnalisée</p>
        </div>

        {/* Dés standards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            onClick={() => rollDice("1d4", "d4")}
            className="bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg font-semibold"
          >
            D4
          </button>
          <button
            onClick={() => rollDice("1d6", "d6")}
            className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg font-semibold"
          >
            D6
          </button>
          <button
            onClick={() => rollDice("1d8", "d8")}
            className="bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-4 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg font-semibold"
          >
            D8
          </button>
          <button
            onClick={() => rollDice("1d10", "d10")}
            className="bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg font-semibold"
          >
            D10
          </button>
          <button
            onClick={() => rollDice("1d12", "d12")}
            className="bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-4 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg font-semibold"
          >
            D12
          </button>
          <button
            onClick={() => rollDice("1d20", "d20")}
            className="bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg font-semibold"
          >
            D20
          </button>
          <button
            onClick={() => rollDice("1d100", "d100")}
            className="bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg font-semibold col-span-3"
          >
            🎯 D100
          </button>
        </div>

        {/* Lancers multiples */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Lancers multiples</h4>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => rollDice("2d6", "2d6")}
              className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md text-sm font-medium"
            >
              2D6
            </button>
            <button
              onClick={() => rollDice("3d6", "3d6")}
              className="bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md text-sm font-medium"
            >
              3D6
            </button>
            <button
              onClick={() => rollDice("4d6", "4d6")}
              className="bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-gray-900 text-white px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md text-sm font-medium"
            >
              4D6
            </button>
            <button
              onClick={() => rollDice("2d20", "2d20")}
              className="bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md text-sm font-medium"
            >
              2D20
            </button>
          </div>
        </div>

        {/* Lancer personnalisé */}
        <div className="mb-6">
          <button
            onClick={() => setShowCustomInput(true)}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg font-semibold flex items-center justify-center gap-2"
          >
            <span className="text-xl">🎲</span>
            Lancer personnalisé
            <span className="text-sm opacity-75">(ex: 2d6+3)</span>
          </button>
        </div>

        <div className="flex justify-center">
          <button 
            onClick={hide} 
            className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md font-medium"
          >
            Annuler
          </button>
        </div>
      </div>

      {/* Modale de saisie personnalisée */}
      {showCustomInput && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white rounded-2xl p-6 shadow-2xl w-full max-w-sm border border-gray-700">
            <div className="text-center mb-4">
              <h4 className="text-xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                🎲 Notation personnalisée
              </h4>
              <p className="text-gray-400 text-sm">Entrez votre notation de dés</p>
            </div>
            
            <div className="mb-4">
              <input
                type="text"
                value={customNotation}
                onChange={(e) => setCustomNotation(e.target.value)}
                placeholder="Ex: 2d6+3, 1d20, 4d10-2"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && handleCustomSubmit()}
              />
              <p className="text-xs text-gray-500 mt-2">
                Format: XdY+Z (ex: 2d6+3, 1d4, 3d8-1)
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleCustomSubmit}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg font-semibold"
              >
                Lancer
              </button>
              <button
                onClick={handleCustomCancel}
                className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md font-medium"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
