import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import apiService from '../services/api';
import { useSocket } from '../context/SocketContext';
import '../components/CombatMap.css';

const GRID_SIZE = 10;
const CELL_SIZE = 50;

export default function CombatViewerPage() {
  const { gameId } = useParams();
  const socket = useSocket();
  const mapRef = useRef(null);
  
  const [combat, setCombat] = useState(null);
  
  // Charger le combat actif
  useEffect(() => {
    loadCombat();
    
    const interval = setInterval(loadCombat, 2000);
    return () => clearInterval(interval);
  }, [gameId]);

  // Écouter les mises à jour WebSocket
  useEffect(() => {
    if (!socket) return;

    socket.on('combatStarted', (data) => {
      if (data.gameId === gameId) {
        setCombat(data.combat);
      }
    });

    socket.on('combatantMoved', (data) => {
      if (data.gameId === gameId) {
        loadCombat();
      }
    });

    socket.on('enemyAdded', (data) => {
      if (data.gameId === gameId) {
        loadCombat();
      }
    });

    socket.on('enemyUpdated', (data) => {
      if (data.gameId === gameId) {
        loadCombat();
      }
    });

    socket.on('enemyRemoved', (data) => {
      if (data.gameId === gameId) {
        loadCombat();
      }
    });

    socket.on('combatantRemoved', (data) => {
      if (data.gameId === gameId) {
        loadCombat();
      }
    });

    socket.on('combatEnded', (data) => {
      if (data.gameId === gameId) {
        setCombat(null);
      }
    });

    return () => {
      socket.off('combatStarted');
      socket.off('combatantMoved');
      socket.off('enemyAdded');
      socket.off('enemyUpdated');
      socket.off('enemyRemoved');
      socket.off('combatantRemoved');
      socket.off('combatEnded');
    };
  }, [socket, gameId]);

  const loadCombat = async () => {
    try {
      const activeCombat = await apiService.getActiveCombat(gameId);
      setCombat(activeCombat);
    } catch (error) {
      // Pas de combat actif
      setCombat(null);
    }
  };

  if (!combat) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">⚔️</div>
          <h1 className="text-3xl font-bold text-white mb-2">Aucun combat en cours</h1>
          <p className="text-purple-200">En attente du Maître de Jeu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">⚔️ Combat - Tour {combat.currentRound}</h1>
          <p className="text-purple-200">Observez la bataille en temps réel</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Grille de combat */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900 border-2 border-purple-500 rounded-lg p-4 shadow-xl">
              <div 
                ref={mapRef}
                className="combat-grid"
                style={{
                  width: `${GRID_SIZE * CELL_SIZE}px`,
                  height: `${GRID_SIZE * CELL_SIZE}px`,
                  margin: '0 auto'
                }}
              >
                {/* Tracer la grille */}
                {Array.from({ length: GRID_SIZE + 1 }).map((_, i) => (
                  <div
                    key={`h-${i}`}
                    className="grid-line horizontal"
                    style={{ top: `${i * CELL_SIZE}px` }}
                  />
                ))}
                {Array.from({ length: GRID_SIZE + 1 }).map((_, i) => (
                  <div
                    key={`v-${i}`}
                    className="grid-line vertical"
                    style={{ left: `${i * CELL_SIZE}px` }}
                  />
                ))}

                {/* Personnages */}
                {combat.combatants?.map(combatant => (
                  <div
                    key={`char-${combatant.id}`}
                    className="combatant character"
                    style={{
                      left: `${combatant.xPos * CELL_SIZE}px`,
                      top: `${combatant.yPos * CELL_SIZE}px`
                    }}
                    title={`${combatant.character.name}\nVie: ${combatant.character.currentLifePoints}/${combatant.character.lifePoints}`}
                  >
                    <span className="combatant-name">{combatant.character.name.substring(0, 3)}</span>
                    <div className="life-bar">
                      <div 
                        className="life-fill"
                        style={{
                          width: `${(combatant.character.currentLifePoints / combatant.character.lifePoints) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                ))}

                {/* Ennemis - les joueurs ne voient que leur présence, pas les stats */}
                {combat.enemies?.map(enemy => (
                  <div
                    key={`enemy-${enemy.id}`}
                    className="combatant enemy"
                    style={{
                      left: `${enemy.xPos * CELL_SIZE}px`,
                      top: `${enemy.yPos * CELL_SIZE}px`
                    }}
                    title={`${enemy.name}`}
                  >
                    <span className="combatant-name">{enemy.name.substring(0, 3)}</span>
                    <div className="life-bar">
                      <div 
                        className="life-fill enemy"
                        style={{
                          width: `100%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Informations */}
          <div className="space-y-4">
            {/* Personnages joueurs */}
            <div className="bg-slate-900 border-2 border-blue-500 rounded-lg p-4 shadow-xl">
              <h3 className="text-xl font-bold text-blue-200 mb-3">Personnages ({combat.combatants?.length || 0})</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {combat.combatants?.map(c => (
                  <div key={c.id} className="bg-blue-500/10 border border-blue-500 rounded p-2">
                    <div className="font-bold text-blue-200">{c.character.name}</div>
                    <div className="text-sm text-blue-300 mt-1">
                      Vie: <span className={
                        c.character.currentLifePoints > c.character.lifePoints * 0.5 
                          ? 'text-green-400' 
                          : c.character.currentLifePoints > c.character.lifePoints * 0.25 
                            ? 'text-yellow-400'
                            : 'text-red-400'
                      }>
                        {c.character.currentLifePoints}/{c.character.lifePoints}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ennemis visibles */}
            <div className="bg-slate-900 border-2 border-red-500 rounded-lg p-4 shadow-xl">
              <h3 className="text-xl font-bold text-red-200 mb-3">Ennemis ({combat.enemies?.length || 0})</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {combat.enemies?.length > 0 ? (
                  combat.enemies.map(e => (
                    <div key={e.id} className="bg-red-500/10 border border-red-500 rounded p-2">
                      <div className="font-bold text-red-200">{e.name}</div>
                      <div className="text-sm text-red-300 mt-1">
                        Vie visible: <span className="text-red-400">?/?</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-red-300/70 italic">Aucun ennemi visible</p>
                )}
              </div>
            </div>

            {/* Légende */}
            <div className="bg-slate-900 border border-purple-400 rounded-lg p-3 text-sm">
              <div className="font-bold text-purple-300 mb-2">Légende</div>
              <div className="space-y-1 text-purple-200">
                <div>🔵 Personnage</div>
                <div>❌ Ennemi</div>
                <div className="text-xs text-purple-300 mt-2">Les informations des ennemis (vie, dégâts) sont visibles uniquement par le MJ.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
