import { useDiceModal } from "../../context/DiceModalContext";
import { useSocket } from "../../context/SocketContext";

export default function DiceSelectorModal() {
  const { open, hide } = useDiceModal();
  const socket = useSocket();

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
    
    const player = localStorage.getItem("aria-jdr:user") || "MJ";
    console.log(`[DiceSelectorModal] Envoi de dice:roll - Type: ${type}, Player: ${player}`);

    socket.emit("dice:roll", { type, player });
    hide();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-900 text-white rounded-xl p-6 shadow-lg w-80">
        <h3 className="text-lg font-semibold mb-4 text-center">Choisir le type de dé</h3>

        <div className="flex gap-4 mb-4 justify-center">
          <button
            onClick={() => rollDice("d6")}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            D6
          </button>
          <button
            onClick={() => rollDice("d100")}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            D100
          </button>
        </div>

        <div className="flex justify-center">
          <button onClick={hide} className="bg-gray-600 text-white px-4 py-2 rounded">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
