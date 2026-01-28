import { useState, useEffect } from 'react';

export default function CombatNotification({ gameId, onJoinCombat }) {
  const [isVisible, setIsVisible] = useState(false);
  const [combatMessage, setCombatMessage] = useState('');

  useEffect(() => {
    // Écouter les événements de combat via WebSocket
    const handleCombatStarted = (data) => {
      if (data.gameId === gameId) {
        setCombatMessage('Un combat a commencé!');
        setIsVisible(true);
        
        // Auto-masquer après 10 secondes
        const timeout = setTimeout(() => {
          setIsVisible(false);
        }, 10000);
        
        return () => clearTimeout(timeout);
      }
    };

    // Listener via événement personnalisé (si utilisé localement)
    window.addEventListener('combatStarted', (e) => {
      if (e.detail?.gameId === gameId) {
        handleCombatStarted(e.detail);
      }
    });

    return () => {
      window.removeEventListener('combatStarted', handleCombatStarted);
    };
  }, [gameId]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-pulse">
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-4 rounded-lg shadow-2xl border-2 border-red-400 max-w-sm">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">⚔️</span>
          <div>
            <p className="font-bold text-lg">{combatMessage}</p>
            <p className="text-sm opacity-90">Les combattants se rassemblent...</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              onJoinCombat?.();
              setIsVisible(false);
            }}
            className="flex-1 px-4 py-2 bg-white text-red-600 rounded font-bold hover:bg-red-50 transition-all"
          >
            ✓ Rejoindre
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="px-4 py-2 bg-red-700/50 hover:bg-red-700 text-white rounded font-bold transition-all"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
