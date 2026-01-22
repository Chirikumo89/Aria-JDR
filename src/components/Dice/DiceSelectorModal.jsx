import { useDiceModal } from "../../context/DiceModalContext";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import { useGame } from "../../context/GameContext";

export default function DiceSelectorModal() {
  const { open, hide } = useDiceModal();
  const socket = useSocket();
  const { user } = useAuth();
  const { currentGame, characters } = useGame();

  console.log("[DiceSelectorModal] Render, open:", open);

  if (!open) return null;

  const rollDice = (type) => {
    console.log(`[DiceSelectorModal] Lancement du dé : ${type}`);
    console.log(`[DiceSelectorModal] Socket disponible :`, !!socket);
    console.log(`[DiceSelectorModal] Socket connecté :`, socket?.connected);
    
    if (!socket) {
      console.error("[DiceSelectorModal] Socket non disponible !");
      return;
    }
    
    if (!socket.connected) {
      console.error("[DiceSelectorModal] Socket non connecté !");
      return;
    }
    
    const player = user?.username || localStorage.getItem("aria-jdr:user") || "MJ";
    
    // Trouver le personnage de l'utilisateur actuel dans la partie
    const userCharacter = characters?.find(char => char.userId === user?.id);
    
    console.log(`[DiceSelectorModal] Envoi de dice:roll - Type: ${type}, Player: ${player}`);
    console.log(`[DiceSelectorModal] GameId: ${currentGame?.id}, CharacterId: ${userCharacter?.id}, UserId: ${user?.id}`);

    // Utiliser l'ID de session global pour identifier le lanceur
    const sessionId = window.diceSessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    socket.emit("dice:roll", { 
      type, 
      player,
      sessionId,
      gameId: currentGame?.id || null,
      characterId: userCharacter?.id || null,
      userId: user?.id || null
    });
    hide();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-900 text-white rounded-xl p-6 shadow-lg w-80">
        <h3 className="text-lg font-semibold mb-4 text-center">Choisir le type de dé</h3>

        <div className="flex gap-4 mb-4 justify-center">
          <button
            type="button"
            onClick={() => rollDice("d6")}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            D6
          </button>
          <button
            type="button"
            onClick={() => rollDice("d100")}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            D100
          </button>
        </div>

        <div className="flex justify-center">
          <button type="button" onClick={hide} className="bg-gray-600 text-white px-4 py-2 rounded">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
