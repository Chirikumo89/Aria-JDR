import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import apiService from '../../services/api';

// Clé pour sauvegarder la position dans localStorage
const POSITION_STORAGE_KEY = 'dice-history-widget-position';

// Position par défaut
const DEFAULT_POSITION = { x: window.innerWidth - 280, y: 80 };

export default function DiceHistoryWidget() {
  const [recentRolls, setRecentRolls] = useState([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(() => {
    // Charger la position sauvegardée
    try {
      const saved = localStorage.getItem(POSITION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Vérifier que la position est dans les limites de l'écran
        return {
          x: Math.min(Math.max(0, parsed.x), window.innerWidth - 280),
          y: Math.min(Math.max(0, parsed.y), window.innerHeight - 100)
        };
      }
    } catch (e) {
      console.error('Erreur chargement position widget:', e);
    }
    return DEFAULT_POSITION;
  });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const socket = useSocket();
  const mountedRef = useRef(true);
  const widgetRef = useRef(null);

  // Charger les jets récents au démarrage (TOUS les jets, toutes parties)
  useEffect(() => {
    const loadRecentRolls = async () => {
      try {
        setLoading(true);
        const rolls = await apiService.getRecentDiceRolls(5);
        console.log('[DiceHistoryWidget] Jets chargés depuis API:', rolls.length);
        if (mountedRef.current) {
          setRecentRolls(rolls);
        }
      } catch (err) {
        console.error('[DiceHistoryWidget] Erreur chargement:', err);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    loadRecentRolls();
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Écouter les nouveaux jets en temps réel
  useEffect(() => {
    mountedRef.current = true;
    
    if (!socket) {
      console.log('[DiceHistoryWidget] ❌ Pas de socket disponible');
      return;
    }

    console.log('[DiceHistoryWidget] ✅ Socket trouvé, connecté:', socket.connected);

    // Écouter tous les résultats de dés
    const handleDiceResult = (data) => {
      console.log('[DiceHistoryWidget] 🎲 dice:result reçu:', data.player, data.result, data.type);
      
      if (data.result !== null && data.result !== undefined && mountedRef.current) {
        // Utiliser savedRoll s'il existe, sinon créer un objet temporaire
        const rollToAdd = data.savedRoll 
          ? { ...data.savedRoll, playerName: data.savedRoll.playerName || data.player }
          : {
              id: `temp_${Date.now()}_${Math.random()}`,
              diceType: data.type || data.notation || 'unknown',
              result: data.result,
              playerName: data.player,
              createdAt: new Date().toISOString()
            };
        
        console.log('[DiceHistoryWidget] ➕ Ajout du jet:', rollToAdd);
        setRecentRolls(prev => {
          // Éviter les doublons (par ID)
          const filtered = prev.filter(r => r.id !== rollToAdd.id);
          return [rollToAdd, ...filtered].slice(0, 5);
        });
      }
    };

    socket.on('dice:result', handleDiceResult);
    console.log('[DiceHistoryWidget] 👂 Écoute active sur dice:result');

    return () => {
      mountedRef.current = false;
      socket.off('dice:result', handleDiceResult);
    };
  }, [socket]);

  // Gestion du drag and drop
  const handleMouseDown = (e) => {
    // Ne pas déclencher si on clique sur un bouton ou un lien
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('a') || e.target.closest('button')) {
      return;
    }
    
    setIsDragging(true);
    const rect = widgetRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newX = Math.min(Math.max(0, e.clientX - dragOffset.x), window.innerWidth - 280);
    const newY = Math.min(Math.max(0, e.clientY - dragOffset.y), window.innerHeight - 100);
    
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      // Sauvegarder la position
      localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(position));
    }
  };

  // Ajouter/retirer les listeners globaux pour le drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragOffset]);

  // Réinitialiser la position si la fenêtre est redimensionnée
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 280),
        y: Math.min(prev.y, window.innerHeight - 100)
      }));
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Obtenir l'icône du type de dé
  const getDiceIcon = (diceType) => {
    switch (diceType?.toLowerCase()) {
      case 'd6':
        return '🎲';
      case 'd100':
        return '💯';
      case 'd10':
        return '🔟';
      case 'd20':
        return '⚔️';
      default:
        return '🎲';
    }
  };

  // Formater la date avec jour et heure
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    // Si moins de 5 minutes, afficher "à l'instant" ou "il y a X min"
    if (diffMins < 1) return 'à l\'instant';
    if (diffMins < 5) return `il y a ${diffMins}min`;
    
    // Sinon afficher la date et l'heure
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    if (isToday) {
      return `Aujourd'hui ${timeStr}`;
    } else if (isYesterday) {
      return `Hier ${timeStr}`;
    } else {
      return date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  // Afficher même sans partie sélectionnée (pour voir les jets en temps réel)
  // Si pas de partie, afficher quand même le widget avec les jets récents via socket

  return (
    <div 
      ref={widgetRef}
      className={`fixed z-40 animate-fadeIn ${isDragging ? 'cursor-grabbing' : ''}`}
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        touchAction: 'none'
      }}
    >
      {/* Widget compact */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg overflow-hidden transition-all duration-300 w-64">
        {/* Header du widget - zone de drag */}
        <div 
          className={`flex items-center cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
          onMouseDown={handleMouseDown}
        >
          <div className="flex-1 px-3 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold text-white select-none">
              <span className="text-lg">🎲</span>
              Derniers Jets
              {recentRolls.length > 0 && (
                <span className="px-1.5 py-0.5 bg-purple-500 rounded-full text-xs">
                  {recentRolls.length}
                </span>
              )}
            </span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <svg 
                className={`w-4 h-4 text-white/70 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Liste des jets */}
        {isExpanded && (
          <div className="max-h-80 overflow-y-auto">
            {/* Lien vers la page complète - EN HAUT */}
            <Link 
              to="/dice-history"
              className="block px-3 py-2 text-center text-sm text-purple-400 hover:text-purple-300 hover:bg-white/5 transition-colors border-b border-white/10"
            >
              📊 Voir tout l'historique
            </Link>
            
            {loading ? (
              <div className="px-3 py-4 text-center text-white/50 text-sm">
                <div className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2"></div>
                Chargement...
              </div>
            ) : recentRolls.length === 0 ? (
              <div className="px-3 py-4 text-center text-white/50 text-sm">
                Aucun jet enregistré
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {recentRolls.map((roll, index) => {
                  // Déterminer le nom à afficher
                  const displayName = roll.character?.name 
                    || roll.user?.username 
                    || roll.playerName 
                    || 'Joueur';
                  
                  return (
                    <div
                      key={roll.id || index}
                      className="px-3 py-2 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-lg flex-shrink-0">{getDiceIcon(roll.diceType)}</span>
                          <div className="min-w-0">
                            <div className="text-white text-sm font-medium truncate">
                              {displayName}
                            </div>
                            <div className="text-white/50 text-xs">
                              {roll.diceType?.toUpperCase() || 'Dé'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className={`text-lg font-bold ${
                            roll.diceType?.toLowerCase() === 'd100' 
                              ? roll.result <= 20 
                                ? 'text-green-400' 
                                : roll.result >= 80 
                                  ? 'text-red-400' 
                                  : 'text-white'
                              : 'text-white'
                          }`}>
                            {roll.result}
                          </div>
                          <div className="text-white/40 text-xs whitespace-nowrap">
                            {formatDateTime(roll.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
