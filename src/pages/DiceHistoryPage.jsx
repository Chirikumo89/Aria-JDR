import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../services/api';
import { useSocket } from '../context/SocketContext';

export default function DiceHistoryPage() {
  const [diceRolls, setDiceRolls] = useState([]);
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('history'); // 'history', 'stats', 'charts'
  const [filter, setFilter] = useState({ diceType: 'all', player: 'all', session: 'latest', specificDate: null });
  const [lastUpdate, setLastUpdate] = useState(null);
  const socket = useSocket();
  const mountedRef = useRef(true);

  // Fonction pour recharger les stats
  const refreshStats = useCallback(async () => {
    try {
      const statsData = await apiService.getDiceStats();
      if (mountedRef.current) {
        setStats(statsData);
      }
    } catch (err) {
      console.error('Erreur rechargement stats:', err);
    }
  }, []);

  // Charger les données initiales
  useEffect(() => {
    mountedRef.current = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const [rollsData, statsData] = await Promise.all([
          apiService.getRecentDiceRolls(100),
          apiService.getDiceStats()
        ]);
        if (mountedRef.current) {
          setDiceRolls(rollsData);
          setStats(statsData);

          // Extraire les sessions (jours uniques) des données
          const uniqueDates = [...new Set(rollsData.map(roll => {
            const date = new Date(roll.createdAt);
            return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
          }))].sort((a, b) => {
            const dateA = new Date(a.split('/').reverse().join('-'));
            const dateB = new Date(b.split('/').reverse().join('-'));
            return dateB - dateA;
          });
          setSessions(uniqueDates);
        }
      } catch (err) {
        console.error('Erreur chargement historique:', err);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };
    loadData();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Écouter les nouveaux jets en temps réel
  useEffect(() => {
    if (!socket) return;

    const handleDiceResult = (data) => {
      console.log('[DiceHistoryPage] 🎲 Nouveau jet reçu:', data);
      
      if (data.result !== null && data.result !== undefined && mountedRef.current) {
        // Créer l'objet roll à ajouter
        const newRoll = data.savedRoll || {
          id: `temp_${Date.now()}_${Math.random()}`,
          diceType: data.type || data.notation || 'unknown',
          result: data.result,
          playerName: data.player,
          createdAt: new Date().toISOString()
        };

        // Ajouter le nouveau jet à la liste
        setDiceRolls(prev => {
          const filtered = prev.filter(r => r.id !== newRoll.id);
          return [newRoll, ...filtered].slice(0, 100);
        });

        // Rafraîchir les statistiques
        refreshStats();

        // Indiquer la mise à jour
        setLastUpdate(new Date());
      }
    };

    socket.on('dice:result', handleDiceResult);
    console.log('[DiceHistoryPage] 👂 Écoute active sur dice:result');

    return () => {
      socket.off('dice:result', handleDiceResult);
    };
  }, [socket, refreshStats]);

  // Filtrer les jets
  const filteredRolls = diceRolls.filter(roll => {
    if (filter.diceType !== 'all' && roll.diceType !== filter.diceType) return false;
    const playerName = roll.character?.name || roll.user?.username || roll.playerName || '';
    if (filter.player !== 'all' && playerName !== filter.player) return false;

    // Filtrer par date spécifique si fournie
    if (filter.specificDate) {
      const rollDate = new Date(roll.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const filterDate = new Date(filter.specificDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      if (rollDate !== filterDate) return false;
    } 
    // Filtrer par séance sinon
    else if (filter.session !== 'all') {
      const rollDate = new Date(roll.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      if (filter.session === 'latest') {
        if (sessions.length > 0 && rollDate !== sessions[0]) return false;
      } else if (rollDate !== filter.session) {
        return false;
      }
    }

    return true;
  });

  // Obtenir la liste des joueurs uniques
  const uniquePlayers = [...new Set(diceRolls.map(roll => 
    roll.character?.name || roll.user?.username || roll.playerName || 'Inconnu'
  ))];

  // Obtenir l'icône du type de dé
  const getDiceIcon = (diceType) => {
    switch (diceType?.toLowerCase()) {
      case 'd6': return '🎲';
      case 'd100': return '💯';
      case 'd10': return '🔟';
      case 'd20': return '⚔️';
      default: return '🎲';
    }
  };

  // Formater la date
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Couleur selon le résultat (pour d100)
  const getResultColor = (diceType, result) => {
    if (diceType?.toLowerCase() === 'd100') {
      if (result <= 10) return 'text-green-400';
      if (result <= 30) return 'text-green-300';
      if (result <= 70) return 'text-white';
      if (result <= 90) return 'text-orange-400';
      return 'text-red-400';
    }
    return 'text-white';
  };

  // Calculer la distribution pour un histogramme
  const getDistribution = (rolls, diceType) => {
    const filtered = rolls.filter(r => r.diceType?.toLowerCase() === diceType.toLowerCase());
    const maxValue = diceType === 'd100' ? 100 : diceType === 'd20' ? 20 : diceType === 'd10' ? 10 : 6;
    const bucketSize = diceType === 'd100' ? 10 : 1;
    const buckets = {};
    
    for (let i = 1; i <= maxValue; i += bucketSize) {
      const label = bucketSize > 1 ? `${i}-${i + bucketSize - 1}` : `${i}`;
      buckets[label] = 0;
    }
    
    filtered.forEach(roll => {
      if (bucketSize > 1) {
        const bucketStart = Math.floor((roll.result - 1) / bucketSize) * bucketSize + 1;
        const label = `${bucketStart}-${bucketStart + bucketSize - 1}`;
        if (buckets[label] !== undefined) buckets[label]++;
      } else {
        const label = `${roll.result}`;
        if (buckets[label] !== undefined) buckets[label]++;
      }
    });
    
    return Object.entries(buckets).map(([label, count]) => ({ label, count }));
  };

  // Calculer les données temporelles par séance (jour)
  const getTimelineData = (rolls, diceType = null, sessionFilter = null) => {
    // Filtrer par type si spécifié
    let filtered = diceType
      ? rolls.filter(r => r.diceType?.toLowerCase() === diceType.toLowerCase())
      : rolls;

    // Filtrer par session si spécifié
    if (sessionFilter && sessionFilter !== 'all') {
      filtered = filtered.filter(roll => {
        const rollDate = new Date(roll.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        if (sessionFilter === 'latest') {
          return sessions.length > 0 && rollDate === sessions[0];
        }
        return rollDate === sessionFilter;
      });
    }

    if (filtered.length === 0) return [];

    // Grouper par jour
    const byDay = {};
    filtered.forEach(roll => {
      const date = new Date(roll.createdAt);
      const dayKey = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

      if (!byDay[dayKey]) {
        byDay[dayKey] = {
          date: dayKey,
          timestamp: new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime(),
          rolls: [],
          count: 0,
          sum: 0
        };
      }
      byDay[dayKey].rolls.push(roll);
      byDay[dayKey].count++;
      byDay[dayKey].sum += roll.result;
    });

    // Calculer les moyennes et trier par date
    return Object.values(byDay)
      .map(day => ({
        ...day,
        average: day.sum / day.count,
        min: Math.min(...day.rolls.map(r => r.result)),
        max: Math.max(...day.rolls.map(r => r.result))
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  };

  // Calculer les données pour le Box Plot par séance
  const getBoxPlotData = (rolls, diceType = 'd100') => {
    const filtered = rolls.filter(r => r.diceType?.toLowerCase() === diceType.toLowerCase());

    if (filtered.length === 0) return [];

    // Grouper par jour
    const byDay = {};
    filtered.forEach(roll => {
      const date = new Date(roll.createdAt);
      const dayKey = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

      if (!byDay[dayKey]) {
        byDay[dayKey] = {
          date: dayKey,
          timestamp: new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime(),
          values: []
        };
      }
      byDay[dayKey].values.push(roll.result);
    });

    // Calculer les quartiles pour chaque jour
    return Object.values(byDay)
      .map(day => {
        const sorted = [...day.values].sort((a, b) => a - b);
        const q1Index = Math.floor(sorted.length * 0.25);
        const q2Index = Math.floor(sorted.length * 0.50);
        const q3Index = Math.floor(sorted.length * 0.75);

        return {
          date: day.date,
          timestamp: day.timestamp,
          min: Math.min(...sorted),
          q1: sorted[q1Index],
          median: sorted[q2Index],
          q3: sorted[q3Index],
          max: Math.max(...sorted),
          count: sorted.length
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto mb-4"></div>
          <p className="text-secondary text-lg">Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      {/* Header */}
      <div className="mb-8 animate-fadeIn">
        <div className="flex items-center gap-4 mb-4">
          <Link 
            to="/games" 
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Historique des Jets de Dés
            </h1>
            <div className="flex items-center gap-3">
              <p className="text-secondary">{diceRolls.length} jets enregistrés</p>
              {/* Indicateur de connexion temps réel */}
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs text-green-400">Temps réel</span>
              </div>
            </div>
          </div>
          {lastUpdate && (
            <div className="text-right">
              <div className="text-xs text-secondary">Dernière mise à jour</div>
              <div className="text-sm text-purple-400 font-medium">
                {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 mb-8 border-b border-white/10">
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 font-semibold rounded-t-xl transition-all duration-300 ${
            activeTab === 'history'
              ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-400 border-b-2 border-purple-500'
              : 'text-secondary hover:text-primary hover:bg-white/5'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Historique
          </span>
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-6 py-3 font-semibold rounded-t-xl transition-all duration-300 ${
            activeTab === 'stats'
              ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-400 border-b-2 border-purple-500'
              : 'text-secondary hover:text-primary hover:bg-white/5'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Statistiques
          </span>
        </button>
        <button
          onClick={() => setActiveTab('charts')}
          className={`px-6 py-3 font-semibold rounded-t-xl transition-all duration-300 ${
            activeTab === 'charts'
              ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-400 border-b-2 border-purple-500'
              : 'text-secondary hover:text-primary hover:bg-white/5'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            Graphiques
          </span>
        </button>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'history' && (
        <div className="animate-fadeIn">
          {/* Filtres */}
          <div className="flex flex-wrap gap-4 mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <div>
              <label className="block text-sm text-secondary mb-1">Type de dé</label>
              <select
                value={filter.diceType}
                onChange={(e) => setFilter({ ...filter, diceType: e.target.value })}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="all">Tous</option>
                <option value="d6">D6</option>
                <option value="d10">D10</option>
                <option value="d20">D20</option>
                <option value="d100">D100</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-secondary mb-1">Joueur</label>
              <select
                value={filter.player}
                onChange={(e) => setFilter({ ...filter, player: e.target.value })}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="all">Tous</option>
                {uniquePlayers.map(player => (
                  <option key={player} value={player}>{player}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-secondary mb-1">Date spécifique</label>
              <input
                type="date"
                value={filter.specificDate || ''}
                onChange={(e) => setFilter({ ...filter, specificDate: e.target.value, session: 'all' })}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-secondary mb-1">Séance</label>
              <select
                value={filter.session}
                onChange={(e) => setFilter({ ...filter, session: e.target.value, specificDate: null })}
                disabled={!!filter.specificDate}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="all">Toutes</option>
                <option value="latest">Dernière séance</option>
                {sessions.map((sessionDate, index) => (
                  <option key={index} value={sessionDate}>{sessionDate}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <span className="text-secondary text-sm">{filteredRolls.length} résultat(s)</span>
            </div>
          </div>

          {/* Liste des jets */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
            {filteredRolls.length === 0 ? (
              <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                <div className="text-5xl mb-4">🎲</div>
                <p className="text-secondary">Aucun jet trouvé</p>
              </div>
            ) : (
              filteredRolls.map((roll, index) => {
                const playerName = roll.character?.name || roll.user?.username || roll.playerName || 'Inconnu';
                return (
                  <div
                    key={roll.id || index}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-2xl">
                          {getDiceIcon(roll.diceType)}
                        </div>
                        <div>
                          <div className="text-white font-semibold">{playerName}</div>
                          <div className="text-secondary text-sm">{roll.diceType?.toUpperCase()}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-3xl font-bold ${getResultColor(roll.diceType, roll.result)}`}>
                          {roll.result}
                        </div>
                        <div className="text-muted text-sm">{formatDateTime(roll.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'stats' && stats && (
        <div className="animate-fadeIn">
          {/* Cartes de stats générales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30">
              <div className="text-4xl font-bold text-purple-400">{stats.totalRolls}</div>
              <div className="text-secondary">Jets au total</div>
            </div>
            <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30">
              <div className="text-4xl font-bold text-blue-400">{stats.uniquePlayers}</div>
              <div className="text-secondary">Joueurs différents</div>
            </div>
            <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30">
              <div className="text-4xl font-bold text-green-400">{stats.averageResult?.toFixed(1) || '0'}</div>
              <div className="text-secondary">Moyenne générale</div>
            </div>
            <div className="p-6 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30">
              <div className="text-4xl font-bold text-amber-400">{stats.todayRolls}</div>
              <div className="text-secondary">Jets aujourd'hui</div>
            </div>
          </div>

          {/* Stats par type de dé */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
              </svg>
              Par type de dé
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.byDiceType && Object.entries(stats.byDiceType).map(([type, data]) => (
                <div key={type} className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{getDiceIcon(type)}</span>
                    <span className="text-lg font-bold text-white">{type.toUpperCase()}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-secondary">Nombre de jets</span>
                      <span className="text-white font-semibold">{data.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Moyenne</span>
                      <span className="text-white font-semibold">{data.average?.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Min / Max</span>
                      <span className="text-white font-semibold">{data.min} / {data.max}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Classement des joueurs */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Classement des joueurs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.byPlayer && Object.entries(stats.byPlayer)
                .sort((a, b) => b[1].count - a[1].count)
                .map(([player, data], index) => (
                  <div key={player} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                      index === 1 ? 'bg-gray-400/20 text-gray-300' :
                      index === 2 ? 'bg-amber-700/20 text-amber-600' :
                      'bg-white/10 text-white/60'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-semibold truncate">{player}</div>
                      <div className="text-secondary text-sm">{data.count} jets • Moy: {data.average?.toFixed(1)}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Records */}
          {stats.records && (
            <div>
              <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Records
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.records.bestD100 && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30">
                    <div className="text-green-400 text-sm mb-1">🏆 Meilleur jet D100</div>
                    <div className="text-3xl font-bold text-white">{stats.records.bestD100.result}</div>
                    <div className="text-secondary text-sm">
                      par {stats.records.bestD100.playerName} le {formatDateTime(stats.records.bestD100.createdAt)}
                    </div>
                  </div>
                )}
                {stats.records.worstD100 && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/30">
                    <div className="text-red-400 text-sm mb-1">💀 Pire jet D100</div>
                    <div className="text-3xl font-bold text-white">{stats.records.worstD100.result}</div>
                    <div className="text-secondary text-sm">
                      par {stats.records.worstD100.playerName} le {formatDateTime(stats.records.worstD100.createdAt)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'charts' && (
        <div className="animate-fadeIn">
          {/* Filtres pour les graphiques */}
          <div className="flex flex-wrap gap-4 mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <div>
              <label className="block text-sm text-secondary mb-1">Type de dé</label>
              <select
                value={filter.diceType}
                onChange={(e) => setFilter({ ...filter, diceType: e.target.value })}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="all">Tous</option>
                <option value="d6">D6</option>
                <option value="d10">D10</option>
                <option value="d20">D20</option>
                <option value="d100">D100</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-secondary mb-1">Joueur</label>
              <select
                value={filter.player}
                onChange={(e) => setFilter({ ...filter, player: e.target.value })}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="all">Tous</option>
                {uniquePlayers.map(player => (
                  <option key={player} value={player}>{player}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-secondary mb-1">Date spécifique</label>
              <input
                type="date"
                value={filter.specificDate || ''}
                onChange={(e) => setFilter({ ...filter, specificDate: e.target.value, session: 'all' })}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-secondary mb-1">Séance</label>
              <select
                value={filter.session}
                onChange={(e) => setFilter({ ...filter, session: e.target.value, specificDate: null })}
                disabled={!!filter.specificDate}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="all">Toutes</option>
                <option value="latest">Dernière séance</option>
                {sessions.map((sessionDate, index) => (
                  <option key={index} value={sessionDate}>{sessionDate}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Box Plot D100 */}
          <div className="mb-8 p-6 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-xl font-bold text-primary mb-2">📊 Distribution D100 (Box Plot)</h3>
            <p className="text-secondary text-sm mb-4">Visualisation des quartiles, médiane et extrêmes par séance</p>
            <div className="h-72">
              <BoxPlotChart data={getBoxPlotData(filteredRolls, 'd100')} diceType="D100" />
            </div>
          </div>

          {/* Box Plot D6 */}
          <div className="mb-8 p-6 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-xl font-bold text-primary mb-2">📊 Distribution D6 (Box Plot)</h3>
            <p className="text-secondary text-sm mb-4">Visualisation des quartiles, médiane et extrêmes par séance</p>
            <div className="h-72">
              <BoxPlotChart data={getBoxPlotData(filteredRolls, 'd6')} diceType="D6" />
            </div>
          </div>

          {/* Graphique temporel - Jets dans le temps */}
          <div className="mb-8 p-6 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-xl font-bold text-primary mb-2">Jets dans le temps (D100)</h3>
            <p className="text-secondary text-sm mb-4">Moyenne par séance de jeu avec min/max</p>
            <div className="h-72">
              <TimelineChart data={getTimelineData(filteredRolls, 'd100')} color="#a855f7" />
            </div>
          </div>

          {/* Graphique temporel - Tous les dés */}
          <div className="mb-8 p-6 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-xl font-bold text-primary mb-2">Activité globale dans le temps</h3>
            <p className="text-secondary text-sm mb-4">Nombre de jets par séance</p>
            <div className="h-64">
              <ActivityChart data={getTimelineData(filteredRolls)} />
            </div>
          </div>

          {/* Distribution D100 */}
          <div className="mb-8 p-6 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-xl font-bold text-primary mb-4">Distribution des résultats D100</h3>
            <div className="h-64">
              <DistributionChart data={getDistribution(filteredRolls, 'd100')} color="#a855f7" />
            </div>
          </div>

          {/* Distribution D6 */}
          <div className="mb-8 p-6 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-xl font-bold text-primary mb-4">Distribution des résultats D6</h3>
            <div className="h-48">
              <DistributionChart data={getDistribution(filteredRolls, 'd6')} color="#3b82f6" />
            </div>
          </div>

          {/* Répartition par type */}
          <div className="mb-8 p-6 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-xl font-bold text-primary mb-4">Répartition par type de dé</h3>
            <div className="h-64">
              <PieChartComponent data={stats?.byDiceType} />
            </div>
          </div>

          {/* Jets par joueur */}
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-xl font-bold text-primary mb-4">Jets par joueur</h3>
            <div className="h-64">
              <PlayerBarChart data={stats?.byPlayer} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Composant pour le graphique de distribution (barres)
function DistributionChart({ data, color }) {
  if (!data || data.length === 0) {
    return <div className="h-full flex items-center justify-center text-secondary">Pas de données</div>;
  }

  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="h-full flex items-end gap-1">
      {data.map((item, index) => (
        <div key={index} className="flex-1 flex flex-col items-center gap-1">
          <div 
            className="w-full rounded-t transition-all duration-300 hover:opacity-80"
            style={{ 
              height: `${(item.count / maxCount) * 100}%`,
              backgroundColor: color,
              minHeight: item.count > 0 ? '4px' : '0'
            }}
            title={`${item.label}: ${item.count} jets`}
          />
          <span className="text-xs text-muted rotate-0 whitespace-nowrap">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// Composant pour le camembert
function PieChartComponent({ data }) {
  if (!data) {
    return <div className="h-full flex items-center justify-center text-secondary">Pas de données</div>;
  }

  const entries = Object.entries(data);
  const total = entries.reduce((sum, [, d]) => sum + d.count, 0);
  const colors = ['#a855f7', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];

  let cumulativePercent = 0;

  return (
    <div className="h-full flex items-center justify-center gap-8">
      {/* Cercle SVG */}
      <svg viewBox="0 0 100 100" className="w-48 h-48">
        {entries.map(([type, d], index) => {
          const percent = (d.count / total) * 100;
          const startAngle = cumulativePercent * 3.6;
          cumulativePercent += percent;
          const endAngle = cumulativePercent * 3.6;

          const startRad = (startAngle - 90) * (Math.PI / 180);
          const endRad = (endAngle - 90) * (Math.PI / 180);

          const x1 = 50 + 40 * Math.cos(startRad);
          const y1 = 50 + 40 * Math.sin(startRad);
          const x2 = 50 + 40 * Math.cos(endRad);
          const y2 = 50 + 40 * Math.sin(endRad);

          const largeArc = percent > 50 ? 1 : 0;

          return (
            <path
              key={type}
              d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
              fill={colors[index % colors.length]}
              className="hover:opacity-80 transition-opacity cursor-pointer"
            >
              <title>{type.toUpperCase()}: {d.count} jets ({percent.toFixed(1)}%)</title>
            </path>
          );
        })}
      </svg>

      {/* Légende */}
      <div className="space-y-2">
        {entries.map(([type, d], index) => (
          <div key={type} className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span className="text-white font-medium">{type.toUpperCase()}</span>
            <span className="text-secondary">({d.count})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Composant pour le graphique à barres des joueurs
function PlayerBarChart({ data }) {
  if (!data) {
    return <div className="h-full flex items-center justify-center text-secondary">Pas de données</div>;
  }

  const entries = Object.entries(data).sort((a, b) => b[1].count - a[1].count).slice(0, 10);
  const maxCount = Math.max(...entries.map(([, d]) => d.count), 1);

  return (
    <div className="h-full flex flex-col gap-2 justify-center">
      {entries.map(([player, d]) => (
        <div key={player} className="flex items-center gap-3">
          <div className="w-24 text-sm text-white truncate text-right">{player}</div>
          <div className="flex-1 h-6 bg-white/10 rounded overflow-hidden">
            <div 
              className="h-full rounded transition-all duration-500"
              style={{ 
                width: `${(d.count / maxCount) * 100}%`,
                background: `linear-gradient(90deg, #a855f7, #3b82f6)`
              }}
            />
          </div>
          <div className="w-12 text-sm text-secondary">{d.count}</div>
        </div>
      ))}
    </div>
  );
}

// Composant pour le graphique temporel (moyenne par séance)
function TimelineChart({ data, color }) {
  if (!data || data.length === 0) {
    return <div className="h-full flex items-center justify-center text-secondary">Pas de données</div>;
  }

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const maxAvg = Math.max(...data.map(d => d.max), 100);
  const minAvg = Math.min(...data.map(d => d.min), 0);

  return (
    <div className="h-full flex flex-col">
      {/* Zone du graphique */}
      <div className="flex-1 relative">
        <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
          {/* Grille horizontale */}
          {[0, 25, 50, 75, 100].map(val => {
            const y = padding.top + ((maxAvg - val) / (maxAvg - minAvg)) * (200 - padding.top - padding.bottom);
            return (
              <g key={val}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={600 - padding.right}
                  y2={y}
                  stroke="rgba(255,255,255,0.1)"
                  strokeDasharray="4,4"
                />
                <text x={padding.left - 5} y={y + 4} fill="rgba(255,255,255,0.5)" fontSize="10" textAnchor="end">
                  {val}
                </text>
              </g>
            );
          })}

          {/* Zone min/max (aire) */}
          <path
            d={`
              M ${padding.left} ${padding.top + ((maxAvg - data[0].max) / (maxAvg - minAvg)) * (200 - padding.top - padding.bottom)}
              ${data.map((d, i) => {
                const x = padding.left + (i / (data.length - 1 || 1)) * (600 - padding.left - padding.right);
                const y = padding.top + ((maxAvg - d.max) / (maxAvg - minAvg)) * (200 - padding.top - padding.bottom);
                return `L ${x} ${y}`;
              }).join(' ')}
              ${data.slice().reverse().map((d, i) => {
                const x = padding.left + ((data.length - 1 - i) / (data.length - 1 || 1)) * (600 - padding.left - padding.right);
                const y = padding.top + ((maxAvg - d.min) / (maxAvg - minAvg)) * (200 - padding.top - padding.bottom);
                return `L ${x} ${y}`;
              }).join(' ')}
              Z
            `}
            fill={color}
            fillOpacity="0.15"
          />

          {/* Ligne de moyenne */}
          <path
            d={`M ${data.map((d, i) => {
              const x = padding.left + (i / (data.length - 1 || 1)) * (600 - padding.left - padding.right);
              const y = padding.top + ((maxAvg - d.average) / (maxAvg - minAvg)) * (200 - padding.top - padding.bottom);
              return `${i === 0 ? '' : 'L'} ${x} ${y}`;
            }).join(' ')}`}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points de données */}
          {data.map((d, i) => {
            const x = padding.left + (i / (data.length - 1 || 1)) * (600 - padding.left - padding.right);
            const y = padding.top + ((maxAvg - d.average) / (maxAvg - minAvg)) * (200 - padding.top - padding.bottom);
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r="6"
                  fill={color}
                  className="cursor-pointer hover:r-8 transition-all"
                >
                  <title>{`${d.date}\nMoyenne: ${d.average.toFixed(1)}\nMin: ${d.min} / Max: ${d.max}\n${d.count} jets`}</title>
                </circle>
                <circle cx={x} cy={y} r="3" fill="white" />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Axe X - Dates */}
      <div className="flex justify-between px-12 text-xs text-muted">
        {data.length <= 7 
          ? data.map((d, i) => <span key={i}>{d.date}</span>)
          : <>
              <span>{data[0].date}</span>
              {data.length > 2 && <span>{data[Math.floor(data.length / 2)].date}</span>}
              <span>{data[data.length - 1].date}</span>
            </>
        }
      </div>

      {/* Légende */}
      <div className="flex justify-center gap-6 mt-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5" style={{ backgroundColor: color }}></div>
          <span className="text-secondary">Moyenne</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-3 rounded opacity-30" style={{ backgroundColor: color }}></div>
          <span className="text-secondary">Min/Max</span>
        </div>
      </div>
    </div>
  );
}

// Composant pour l'activité dans le temps (nombre de jets)
function ActivityChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="h-full flex items-center justify-center text-secondary">Pas de données</div>;
  }

  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="h-full flex flex-col">
      {/* Barres */}
      <div className="flex-1 flex items-end gap-1 px-4">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div 
              className="w-full rounded-t transition-all duration-300 hover:opacity-80 relative group"
              style={{ 
                height: `${(d.count / maxCount) * 100}%`,
                background: `linear-gradient(180deg, #a855f7, #3b82f6)`,
                minHeight: d.count > 0 ? '4px' : '0'
              }}
            >
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="font-semibold">{d.date}</div>
                <div>{d.count} jets</div>
                <div>Moy: {d.average.toFixed(1)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Axe X */}
      <div className="flex justify-between px-4 mt-2 text-xs text-muted">
        {data.length <= 7 
          ? data.map((d, i) => (
              <span key={i} className="flex-1 text-center truncate px-0.5">{d.date.slice(0, 5)}</span>
            ))
          : <>
              <span>{data[0].date.slice(0, 5)}</span>
              <span className="flex-1"></span>
              <span>{data[data.length - 1].date.slice(0, 5)}</span>
            </>
        }
      </div>

      {/* Stats résumé */}
      <div className="flex justify-center gap-6 mt-2 text-xs">
        <span className="text-secondary">
          Total: <span className="text-white font-semibold">{data.reduce((sum, d) => sum + d.count, 0)} jets</span>
        </span>
        <span className="text-secondary">
          Séances: <span className="text-white font-semibold">{data.length}</span>
        </span>
        <span className="text-secondary">
          Moy/séance: <span className="text-white font-semibold">{(data.reduce((sum, d) => sum + d.count, 0) / data.length).toFixed(1)}</span>
        </span>
      </div>
    </div>
  );
}

// Composant pour le Box Plot avec tooltip interactif
function BoxPlotChart({ data, diceType = 'd100' }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState(null);

  if (!data || data.length === 0) {
    return <div className="h-full flex items-center justify-center text-secondary">Pas de données pour {diceType}</div>;
  }

  const padding = { top: 20, right: 30, bottom: 40, left: 50 };
  const maxValue = Math.max(...data.map(d => d.max), 100);
  const minValue = 0;
  const chartHeight = 200;
  const chartWidth = 600;

  const getYPosition = (value) => {
    return padding.top + ((maxValue - value) / (maxValue - minValue)) * (chartHeight - padding.top - padding.bottom);
  };

  const boxWidth = Math.max((chartWidth - padding.left - padding.right) / (data.length + 1), 30);
  const boxSpacing = (chartWidth - padding.left - padding.right) / (data.length + 1);

  const handleMouseEnter = (index, x) => {
    setHoveredIndex(index);
    setTooltipPos(x);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setTooltipPos(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Graphique SVG */}
      <div className="flex-1 relative">
        {/* Tooltip flottant */}
        {hoveredIndex !== null && data[hoveredIndex] && (
          <div 
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 bg-gradient-to-b from-gray-900 to-gray-800 border border-purple-500/50 rounded-lg p-4 shadow-2xl z-10 whitespace-nowrap pointer-events-none"
            style={{
              minWidth: '280px',
              boxShadow: '0 0 20px rgba(168, 85, 247, 0.3)'
            }}
          >
            {/* Flèche pointant vers le bas */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
            
            <div className="space-y-2 text-sm">
              <div className="font-bold text-purple-300 text-center border-b border-purple-500/30 pb-2">
                {data[hoveredIndex].date}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div className="text-right">
                  <span className="text-gray-400">Min:</span>
                </div>
                <div className="text-left font-semibold text-blue-400">
                  {data[hoveredIndex].min}
                </div>
                
                <div className="text-right">
                  <span className="text-gray-400">Q1:</span>
                </div>
                <div className="text-left font-semibold text-purple-300">
                  {data[hoveredIndex].q1}
                </div>
                
                <div className="text-right">
                  <span className="text-gray-400">Médiane:</span>
                </div>
                <div className="text-left font-semibold text-green-400">
                  {data[hoveredIndex].median}
                </div>
                
                <div className="text-right">
                  <span className="text-gray-400">Q3:</span>
                </div>
                <div className="text-left font-semibold text-purple-300">
                  {data[hoveredIndex].q3}
                </div>
                
                <div className="text-right">
                  <span className="text-gray-400">Max:</span>
                </div>
                <div className="text-left font-semibold text-blue-400">
                  {data[hoveredIndex].max}
                </div>
              </div>
              <div className="border-t border-purple-500/30 pt-2 mt-2 text-center text-xs text-gray-300">
                <span className="text-purple-400 font-semibold">{data[hoveredIndex].count}</span> résultats
              </div>
              <div className="text-xs text-gray-500 pt-1 text-center">
                Écart (Max-Min): <span className="text-amber-400 font-semibold">{data[hoveredIndex].max - data[hoveredIndex].min}</span>
              </div>
            </div>
          </div>
        )}

        <svg className="w-full h-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet">
          {/* Grille horizontale */}
          {[0, 25, 50, 75, 100].map(val => {
            const y = getYPosition(val);
            return (
              <g key={`grid-${val}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="rgba(255,255,255,0.1)"
                  strokeDasharray="4,4"
                />
                <text 
                  x={padding.left - 5} 
                  y={y + 4} 
                  fill="rgba(255,255,255,0.5)" 
                  fontSize="10" 
                  textAnchor="end"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Axe Y */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={chartHeight - padding.bottom}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
          />

          {/* Axe X */}
          <line
            x1={padding.left}
            y1={chartHeight - padding.bottom}
            x2={chartWidth - padding.right}
            y2={chartHeight - padding.bottom}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
          />

          {/* Box plots */}
          {data.map((day, index) => {
            const x = padding.left + (index + 1) * boxSpacing - boxWidth / 2;
            const minY = getYPosition(day.min);
            const q1Y = getYPosition(day.q1);
            const medianY = getYPosition(day.median);
            const q3Y = getYPosition(day.q3);
            const maxY = getYPosition(day.max);
            const isHovered = hoveredIndex === index;

            return (
              <g 
                key={`boxplot-${index}`}
                onMouseEnter={() => handleMouseEnter(index, x + boxWidth / 2)}
                onMouseLeave={handleMouseLeave}
                style={{ cursor: 'pointer' }}
              >
                {/* Ligne min-max (whiskers) */}
                <line
                  x1={x + boxWidth / 2}
                  y1={minY}
                  x2={x + boxWidth / 2}
                  y2={maxY}
                  stroke={isHovered ? "#60a5fa" : "#a855f7"}
                  strokeWidth={isHovered ? "2.5" : "1.5"}
                  opacity={isHovered ? "1" : "0.6"}
                  style={{ transition: 'all 0.2s ease' }}
                />

                {/* Boîte Q1-Q3 */}
                <rect
                  x={x}
                  y={Math.min(q1Y, q3Y)}
                  width={boxWidth}
                  height={Math.abs(q3Y - q1Y) || 1}
                  fill={isHovered ? "rgba(168, 85, 247, 0.5)" : "rgba(168, 85, 247, 0.3)"}
                  stroke={isHovered ? "#f472b6" : "#a855f7"}
                  strokeWidth={isHovered ? "3" : "2"}
                  style={{ transition: 'all 0.2s ease' }}
                />

                {/* Ligne médiane */}
                <line
                  x1={x}
                  y1={medianY}
                  x2={x + boxWidth}
                  y2={medianY}
                  stroke={isHovered ? "#34d399" : "#10b981"}
                  strokeWidth={isHovered ? "4" : "3"}
                  style={{ transition: 'all 0.2s ease' }}
                />

                {/* Points min et max */}
                <circle
                  cx={x + boxWidth / 2}
                  cy={minY}
                  r={isHovered ? "3.5" : "2.5"}
                  fill={isHovered ? "#60a5fa" : "#3b82f6"}
                  style={{ transition: 'all 0.2s ease' }}
                />
                <circle
                  cx={x + boxWidth / 2}
                  cy={maxY}
                  r={isHovered ? "3.5" : "2.5"}
                  fill={isHovered ? "#60a5fa" : "#3b82f6"}
                  style={{ transition: 'all 0.2s ease' }}
                />

                {/* Zone interactive pour tooltip */}
                <rect
                  x={x - 2}
                  y={Math.min(minY, maxY) - 5}
                  width={boxWidth + 4}
                  height={Math.max(minY, maxY) - Math.min(minY, maxY) + 10}
                  fill="transparent"
                  style={{ pointerEvents: 'auto' }}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Axe X - Dates */}
      <div className="flex justify-between px-12 text-xs text-muted mt-2 -mb-2">
        {data.length <= 7 
          ? data.map((d, i) => <span key={i} className="text-center flex-1 truncate">{d.date.slice(0, 5)}</span>)
          : <>
              <span>{data[0].date.slice(0, 5)}</span>
              {data.length > 2 && <span>{data[Math.floor(data.length / 2)].date.slice(0, 5)}</span>}
              <span>{data[data.length - 1].date.slice(0, 5)}</span>
            </>
        }
      </div>

      {/* Légende */}
      <div className="flex justify-center gap-6 mt-4 text-xs flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-6 h-3 border-2 border-purple-500" style={{ backgroundColor: 'rgba(168, 85, 247, 0.3)' }}></div>
          <span className="text-secondary">Q1-Q3 (50%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4" style={{ borderTop: '3px solid #10b981' }}></div>
          <span className="text-secondary">Médiane</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5" style={{ backgroundColor: '#a855f7' }}></div>
          <span className="text-secondary">Min/Max</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-secondary">Total: <span className="text-white font-semibold">{data.reduce((sum, d) => sum + d.count, 0)} résultats</span></div>
        </div>
      </div>
    </div>
  );
}
