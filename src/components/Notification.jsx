import { useEffect, useState } from "react";
import { CURRENCY_SYMBOLS, CURRENCY_NAMES } from "../utils/currency";

export default function Notification({ notifications, onClose }) {
  console.log("[Notification] 🎯 RENDER - Notifications reçues:", notifications?.length || 0);
  
  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="fixed top-4 left-4 z-60 max-w-sm w-full space-y-2">
      {notifications.map((notification, index) => {
        console.log(`[Notification] 🎯 RENDER ITEM ${index}:`, {
          id: notification.id,
          type: notification.type,
          player: notification.player,
          result: notification.result
        });
        return (
          <NotificationItem 
            key={notification.id} 
            data={notification} 
            onClose={() => onClose(notification.id)} 
          />
        );
      })}
    </div>
  );
}

function NotificationItem({ data, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (data) {
      console.log("[NotificationItem] 🎯 AFFICHAGE NOTIFICATION:", {
        id: data.id,
        type: data.type,
        player: data.player,
        result: data.result,
        notation: data.notation,
        diceType: data.diceType
      });
      setVisible(true);
      // La durée est gérée par le contexte maintenant
    }
  }, [data]);

  const handleClose = () => {
    console.log("[NotificationItem] ❌ FERMETURE NOTIFICATION:", data.id);
    setVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!data || !visible) return null;

  // Fonction pour formater le type de dé
  const formatDiceType = (notation, type) => {
    if (notation) {
      return notation.toUpperCase(); // 1d100, 2d6, etc.
    }
    if (type) {
      // Convertir le type en notation complète
      if (type === 'd100') return '1D100';
      if (type === 'd20') return '1D20';
      if (type === 'd12') return '1D12';
      if (type === 'd10') return '1D10';
      if (type === 'd8') return '1D8';
      if (type === 'd6') return '1D6';
      if (type === 'd4') return '1D4';
      return type.toUpperCase(); // d100, d6, etc.
    }
    return "DÉ";
  };

  const diceType = formatDiceType(data.notation, data.diceType);
  console.log("[Notification] 🎲 Données reçues:", { notation: data.notation, diceType: data.diceType, result: diceType });

  // Fonction pour déterminer si c'est un résultat critique
  const getCriticalResult = (result, diceType) => {
    // Vérifier si c'est un D100 (1D100, d100, etc.)
    const isD100 = diceType.includes('100') || diceType.includes('D100');
    
    if (isD100) {
      if (result >= 1 && result <= 5) {
        return "Réussite critique !";
      } else if (result >= 96 && result <= 100) {
        return "Échec critique !";
      }
    }
    
    return null; // Pas de résultat critique
  };

  const criticalResult = getCriticalResult(data.result, diceType);
  
  // Debug pour les résultats critiques
  if (criticalResult) {
    console.log("[NotificationItem] 🎯 RÉSULTAT CRITIQUE DÉTECTÉ:", {
      id: data.id,
      result: data.result,
      diceType: diceType,
      criticalResult: criticalResult,
      player: data.player
    });
  }

  // Gestion des notifications de type "treasury" (caisse commune)
  if (data.type === 'treasury') {
    return (
      <div className="fixed top-4 left-4 z-60 bg-gradient-to-r from-emerald-400 to-teal-400 text-black px-6 py-4 rounded-xl shadow-2xl transition-all duration-500 transform animate-bounce">
        <div className="text-center relative">
          <div className="absolute -top-1 -left-1 w-4 h-4 bg-emerald-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
            💰
          </div>
          
          <button
            onClick={handleClose}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold hover:bg-red-600 transition-colors"
          >
            ×
          </button>
          <div className="text-lg font-bold">🏛️ Caisse Commune</div>
          <div className="text-sm mt-1">
            {data.message || `${data.username || "Joueur"} a effectué une transaction`}
          </div>
          {data.amount && data.currency && (
            <div className="text-xs text-gray-700 mt-1">
              {data.amount} {CURRENCY_SYMBOLS[data.currency]} {CURRENCY_NAMES[data.currency]}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed top-4 left-4 z-60 bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-6 py-4 rounded-xl shadow-2xl transition-all duration-500 transform ${
      criticalResult ? 'animate-pulse scale-105' : 'animate-bounce'
    }`}>
      <div className="text-center relative">
        {/* IDENTIFIANT VISUEL UNIQUE */}
        <div className="absolute -top-1 -left-1 w-4 h-4 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
          {data.id.toString().slice(-2)}
        </div>
        
        <button
          onClick={handleClose}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold hover:bg-red-600 transition-colors"
        >
          ×
        </button>
        <div className="text-lg font-bold">{data.player || "Joueur"}</div>
        <div className="text-sm">
          a lancé un <span className="font-bold text-blue-600">{diceType}</span> : 
          <span className="text-2xl font-black ml-2">{data.result}</span>
        </div>
        {criticalResult && (
          <div className={`text-lg font-bold mt-2 ${
            criticalResult.includes("Réussite") 
              ? "text-green-600" 
              : "text-red-600"
          }`}>
            {criticalResult}
          </div>
        )}
        {/* DEBUG INFO */}
        <div className="text-xs text-gray-600 mt-1">
          ID: {data.id.toString().slice(-4)} | Type: {data.type}
        </div>
      </div>
    </div>
  );
}
