import { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import apiService from '../../services/api';

export default function DiceHistory({ gameId }) {
  const [diceRolls, setDiceRolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const socket = useSocket();

  // Charger l'historique des jets de dés
  const loadDiceRolls = async () => {
    if (!gameId) return;
    
    try {
      setLoading(true);
      const rolls = await apiService.getDiceRolls(gameId, 100);
      setDiceRolls(rolls);
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des jets de dés:', err);
      setError('Impossible de charger l\'historique des jets de dés');
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage et quand gameId change
  useEffect(() => {
    loadDiceRolls();
  }, [gameId]);

  // Écouter les nouveaux jets de dés en temps réel
  useEffect(() => {
    if (!socket || !gameId) return;

    const handleNewDiceRoll = (data) => {
      console.log('[DiceHistory] Nouveau jet de dé reçu:', data);
      
      // Vérifier si c'est pour cette partie
      if (data.gameId === gameId && data.diceRoll) {
        setDiceRolls(prev => [data.diceRoll, ...prev]);
      }
    };

    socket.on('dice:history:new', handleNewDiceRoll);

    return () => {
      socket.off('dice:history:new', handleNewDiceRoll);
    };
  }, [socket, gameId]);

  // Formater la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  // Obtenir la couleur selon le résultat (pour d100)
  const getResultColor = (diceType, result) => {
    if (diceType?.toLowerCase() === 'd100') {
      if (result <= 10) return 'text-green-400'; // Réussite critique
      if (result <= 50) return 'text-green-300'; // Bonne réussite
      if (result <= 90) return 'text-yellow-300'; // Réussite moyenne
      return 'text-red-400'; // Échec
    }
    return 'text-white';
  };

  if (!gameId) {
    return (
      <div className="text-center text-secondary py-8">
        <p>Sélectionnez une partie pour voir l'historique des jets de dés</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-400 py-8">
        <p>{error}</p>
        <button 
          onClick={loadDiceRolls}
          className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-primary flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Historique des Jets de Dés
        </h3>
        <button
          onClick={loadDiceRolls}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 text-white rounded-xl font-semibold transition-all duration-300 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualiser
        </button>
      </div>

      {/* Liste des jets */}
      {diceRolls.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
          <div className="text-5xl mb-4">🎲</div>
          <p className="text-secondary text-lg">Aucun jet de dé enregistré pour cette partie</p>
          <p className="text-muted mt-2">Les jets apparaîtront ici automatiquement</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {diceRolls.map((roll, index) => (
            <div
              key={roll.id}
              className="group p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-purple-500/30 hover:bg-white/10 transition-all duration-300 animate-fadeIn"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-center justify-between">
                {/* Infos du jet */}
                <div className="flex items-center gap-4">
                  {/* Icône du dé */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-2xl">
                    {getDiceIcon(roll.diceType)}
                  </div>
                  
                  {/* Détails */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary">
                        {roll.diceType?.toUpperCase() || 'Dé'}
                      </span>
                      <span className="text-muted">→</span>
                      <span className={`text-2xl font-bold ${getResultColor(roll.diceType, roll.result)}`}>
                        {roll.result}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-secondary">
                      {roll.character ? (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {roll.character.name}
                          <span className="text-muted">({roll.character.playerName})</span>
                        </span>
                      ) : roll.player ? (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {roll.player}
                        </span>
                      ) : (
                        <span className="text-muted">Joueur inconnu</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="text-right">
                  <div className="text-sm text-muted">
                    {formatDate(roll.createdAt)}
                  </div>
                  {/* Détails pour d100 */}
                  {roll.diceType?.toLowerCase() === 'd100' && roll.tens !== null && roll.units !== null && (
                    <div className="text-xs text-muted mt-1">
                      ({roll.tens}0 + {roll.units})
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Statistiques rapides */}
      {diceRolls.length > 0 && (
        <div className="mt-6 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
          <h4 className="text-sm font-semibold text-secondary mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Statistiques
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{diceRolls.length}</div>
              <div className="text-xs text-muted">Jets total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {diceRolls.filter(r => r.diceType?.toLowerCase() === 'd6').length}
              </div>
              <div className="text-xs text-muted">Jets D6</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {diceRolls.filter(r => r.diceType?.toLowerCase() === 'd100').length}
              </div>
              <div className="text-xs text-muted">Jets D100</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">
                {diceRolls.length > 0 
                  ? Math.round(diceRolls.reduce((sum, r) => sum + r.result, 0) / diceRolls.length)
                  : 0
                }
              </div>
              <div className="text-xs text-muted">Moyenne</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
