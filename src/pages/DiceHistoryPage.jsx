import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { useSocket } from '../context/SocketContext';

export default function DiceHistoryPage() {
  const [diceRolls, setDiceRolls] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('history'); // 'history', 'stats', 'charts'
  const [filter, setFilter] = useState({ diceType: 'all', player: 'all' });
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
          {/* Distribution D100 */}
          <div className="mb-8 p-6 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-xl font-bold text-primary mb-4">Distribution des résultats D100</h3>
            <div className="h-64">
              <DistributionChart data={getDistribution(diceRolls, 'd100')} color="#a855f7" />
            </div>
          </div>

          {/* Distribution D6 */}
          <div className="mb-8 p-6 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-xl font-bold text-primary mb-4">Distribution des résultats D6</h3>
            <div className="h-48">
              <DistributionChart data={getDistribution(diceRolls, 'd6')} color="#3b82f6" />
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
      {entries.map(([player, d], index) => (
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
