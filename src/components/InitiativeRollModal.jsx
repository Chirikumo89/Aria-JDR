import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';

export default function InitiativeRollModal({ combatId, gameId, characterName, reflexes, onClose }) {
  const { user } = useAuth();
  const socket = useSocket();
  const [d100Result, setD100Result] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Lancer 1D100
  const rollD100 = () => {
    setIsRolling(true);
    // Simuler un délai de lancer de dé
    setTimeout(() => {
      const result = Math.floor(Math.random() * 100) + 1;
      setD100Result(result);
      
      const passed = result <= reflexes;
      setFeedback({
        result,
        passed,
        reflexes,
        message: passed 
          ? `✅ Réussi! ${result} ≤ ${reflexes}` 
          : `❌ Raté! ${result} > ${reflexes}`
      });
      
      setIsRolling(false);
    }, 800);
  };

  const handleConfirm = async () => {
    if (!d100Result) {
      alert('Veuillez d\'abord lancer le dé');
      return;
    }

    try {
      // Envoyer le résultat via WebSocket
      if (socket) {
        socket.emit('initiativeRollResult', {
          gameId,
          combatId,
          characterName,
          userId: user.id,
          result: d100Result,
          reflexes,
          passed: d100Result <= reflexes
        });
      }
      
      onClose();
    } catch (error) {
      alert('Erreur: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gradient-to-b from-amber-50 to-amber-100 border-4 border-amber-900 rounded-2xl p-8 max-w-sm mx-4 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-amber-900 mb-2">⚔️ Initiative</h2>
          <p className="text-lg text-amber-800 font-semibold">{characterName}</p>
          <p className="text-sm text-amber-700 mt-2">Réflexes: <span className="font-bold">{reflexes}%</span></p>
        </div>

        {/* Dé */}
        <div className="flex justify-center mb-6">
          <div 
            className={`
              w-32 h-32 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl
              flex items-center justify-center text-6xl font-bold text-white
              border-4 border-red-800 shadow-lg
              transition-transform ${isRolling ? 'animate-bounce' : ''}
            `}
          >
            {d100Result !== null ? d100Result : '?'}
          </div>
        </div>

        {/* Feedback */}
        {feedback && (
          <div className={`
            p-4 rounded-lg mb-6 text-center font-bold text-lg
            ${feedback.passed 
              ? 'bg-green-100 text-green-800 border-2 border-green-400' 
              : 'bg-red-100 text-red-800 border-2 border-red-400'
            }
          `}>
            {feedback.message}
          </div>
        )}

        {/* Instructions */}
        {d100Result === null && (
          <div className="text-center mb-6 p-4 bg-amber-200/50 rounded-lg border-2 border-amber-300">
            <p className="text-amber-900 font-semibold">Cliquez sur le bouton pour lancer le dé d100</p>
          </div>
        )}

        {/* Boutons */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={rollD100}
            disabled={isRolling || d100Result !== null}
            className={`
              px-6 py-3 rounded-lg font-bold text-white transition-all
              ${isRolling || d100Result !== null
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 active:scale-95'
              }
            `}
          >
            {isRolling ? '🎲 Lancer...' : '🎲 Lancer le dé'}
          </button>
          
          {d100Result !== null && (
            <button
              onClick={handleConfirm}
              className="px-6 py-3 rounded-lg font-bold text-white bg-green-600 hover:bg-green-700 active:scale-95 transition-all"
            >
              ✓ Valider
            </button>
          )}

          <button
            onClick={onClose}
            className="px-6 py-3 rounded-lg font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 active:scale-95 transition-all"
          >
            ✕ Fermer
          </button>
        </div>

        {/* Aide */}
        <div className="mt-6 p-3 bg-amber-100/50 rounded-lg text-xs text-amber-900 text-center">
          <p>🎯 Si le résultat ≤ Réflexes, vous jouez en premier</p>
          <p>📊 Si le résultat > Réflexes, vous jouez en dernier</p>
        </div>
      </div>
    </div>
  );
}
