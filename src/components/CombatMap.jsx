import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import TurnManager from './TurnManager';
import './CombatMap.css';

const GRID_SIZE = 10;
const CELL_SIZE = 50;

export default function CombatMap({ gameId, onCombatEnd, onCombatStart }) {
  const { user } = useAuth();
  const socket = useSocket();
  const isMJ = user?.role === 'mj';
  
  const [combat, setCombat] = useState(null);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [enemyForm, setEnemyForm] = useState(null);
  const [rollingInitiative, setRollingInitiative] = useState(null);
  const canvasRef = useRef(null);
  const mapRef = useRef(null);

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
        onCombatEnd?.();
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

  const handleStartCombat = async () => {
    try {
      await apiService.createCombat(gameId);
      loadCombat();
      
      // Appeler le callback parent
      onCombatStart?.();
      
      // Émettre une notification à tous les joueurs via WebSocket
      if (socket) {
        socket.emit('combatStartedNotification', {
          gameId,
          message: 'Un combat a commencé!',
          timestamp: new Date()
        });
      }
    } catch (error) {
      alert('Erreur lors du démarrage du combat: ' + error.message);
    }
  };

  const handleEndCombat = async () => {
    try {
      await apiService.endCombat(combat.id);
      setCombat(null);
      onCombatEnd?.();
    } catch (error) {
      alert('Erreur lors de la fin du combat: ' + error.message);
    }
  };

  const handleMapClick = (e) => {
    if (!isMJ || !combat) return;
    
    const rect = mapRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);

    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      if (selectedCharacter?.type === 'character') {
        handleMoveCombatant(selectedCharacter.id, x, y);
      } else if (selectedCharacter?.type === 'enemy') {
        handleMoveEnemy(selectedCharacter.id, x, y);
      }
      setSelectedCharacter(null);
    }
  };

  const handleMapContextMenu = (e) => {
    if (!isMJ) return;
    
    e.preventDefault();
    const rect = mapRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      gridX: x,
      gridY: y
    });
  };

  const handleCombatantContextMenu = (e, type, id) => {
    if (!isMJ) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type,
      id
    });
  };

  const handleMoveCombatant = async (characterId, xPos, yPos) => {
    try {
      await apiService.moveCombatant(combat.id, characterId, null, xPos, yPos);
      loadCombat();
    } catch (error) {
      alert('Erreur lors du déplacement: ' + error.message);
    }
  };

  const handleMoveEnemy = async (enemyId, xPos, yPos) => {
    try {
      await apiService.moveCombatant(combat.id, null, enemyId, xPos, yPos);
      loadCombat();
    } catch (error) {
      alert('Erreur lors du déplacement: ' + error.message);
    }
  };

  const handleRemoveCombatant = async (characterId) => {
    if (!confirm('Retirer ce personnage du combat?')) return;
    
    try {
      await apiService.removeCombatant(combat.id, characterId);
      loadCombat();
    } catch (error) {
      alert('Erreur lors de la suppression: ' + error.message);
    }
  };

  const handleRemoveEnemy = async (enemyId) => {
    if (!confirm('Retirer cet ennemi du combat?')) return;
    
    try {
      await apiService.removeEnemy(enemyId);
      loadCombat();
    } catch (error) {
      alert('Erreur lors de la suppression: ' + error.message);
    }
  };

  const handleAddEnemy = async () => {
    if (!enemyForm.name || !enemyForm.maxLife || !enemyForm.weaponDamage) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    try {
      await apiService.addEnemy(combat.id, {
        name: enemyForm.name,
        maxLife: parseInt(enemyForm.maxLife),
        weaponDamage: enemyForm.weaponDamage,
        xPos: contextMenu?.gridX || 0,
        yPos: contextMenu?.gridY || 0
      });
      loadCombat();
      setEnemyForm(null);
      setContextMenu(null);
    } catch (error) {
      alert('Erreur lors de l\'ajout de l\'ennemi: ' + error.message);
    }
  };

  // Lancer l'initiative pour un combattant
  const handleRollInitiative = async (combatantId) => {
    try {
      setRollingInitiative(combatantId);
      const result = await apiService.rollInitiative(combat.id, combatantId);
      
      // Émettre une notification WebSocket
      if (socket && result.character) {
        socket.emit('initiativeRolled', {
          gameId: gameId,
          combatId: combat.id,
          characterName: result.character.name,
          roll: result.initiativeRoll,
          reflexes: result.reflexesScore,
          passed: result.passed
        });
      }
      
      loadCombat();
      setContextMenu(null);
    } catch (error) {
      alert('Erreur lors du lancer d\'initiative: ' + error.message);
    } finally {
      setRollingInitiative(null);
    }
  };

  // Lancer l'initiative pour un ennemi
  const handleRollInitiativeEnemy = async (enemyId) => {
    try {
      setRollingInitiative(enemyId);
      const result = await apiService.rollInitiativeEnemy(combat.id, enemyId);
      
      // Émettre une notification WebSocket
      if (socket) {
        socket.emit('initiativeRolled', {
          gameId: gameId,
          combatId: combat.id,
          enemyName: result.name,
          roll: result.initiativeRoll,
          reflexes: result.reflexes,
          passed: result.passed
        });
      }
      
      loadCombat();
      setContextMenu(null);
    } catch (error) {
      alert('Erreur lors du lancer d\'initiative: ' + error.message);
    } finally {
      setRollingInitiative(null);
    }
  };

  if (!combat) {
    return (
      <div className="combat-map-container">
        {isMJ ? (
          <button className="btn-primary" onClick={handleStartCombat}>
            Démarrer un combat
          </button>
        ) : (
          <p>Aucun combat en cours</p>
        )}
      </div>
    );
  }

  return (
    <div className="combat-map-container">
      <div className="combat-header">
        <h2>Combat - Tour {combat.currentRound}</h2>
        {isMJ && (
          <button className="btn-danger" onClick={handleEndCombat}>
            Terminer le combat
          </button>
        )}
      </div>

      <div className="combat-content">
        {/* Grille de combat */}
        <div 
          ref={mapRef}
          className="combat-grid"
          onClick={handleMapClick}
          onContextMenu={handleMapContextMenu}
          style={{
            width: `${GRID_SIZE * CELL_SIZE}px`,
            height: `${GRID_SIZE * CELL_SIZE}px`
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
              className={`combatant character ${selectedCharacter?.id === combatant.id ? 'selected' : ''}`}
              style={{
                left: `${combatant.xPos * CELL_SIZE}px`,
                top: `${combatant.yPos * CELL_SIZE}px`
              }}
              onClick={() => isMJ && setSelectedCharacter({ type: 'character', id: combatant.characterId, name: combatant.character.name })}
              onContextMenu={(e) => handleCombatantContextMenu(e, 'character', combatant.characterId)}
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

          {/* Ennemis */}
          {combat.enemies?.map(enemy => (
            <div
              key={`enemy-${enemy.id}`}
              className={`combatant enemy ${selectedCharacter?.id === enemy.id ? 'selected' : ''}`}
              style={{
                left: `${enemy.xPos * CELL_SIZE}px`,
                top: `${enemy.yPos * CELL_SIZE}px`
              }}
              onClick={() => isMJ && setSelectedCharacter({ type: 'enemy', id: enemy.id, name: enemy.name })}
              onContextMenu={(e) => handleCombatantContextMenu(e, 'enemy', enemy.id)}
              title={isMJ ? `${enemy.name}\nVie: ${enemy.currentLife}/${enemy.maxLife}\nDégâts: ${enemy.weaponDamage}` : `${enemy.name}\nVie: ${enemy.currentLife}/${enemy.maxLife}`}
            >
              <span className="combatant-name">{enemy.name.substring(0, 3)}</span>
              <div className="life-bar">
                <div 
                  className="life-fill enemy"
                  style={{
                    width: `${(enemy.currentLife / enemy.maxLife) * 100}%`
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Gestionnaire de tours (pour MJ) */}
        {isMJ && (
          <TurnManager
            combat={combat}
            combatants={combat.combatants || []}
            enemies={combat.enemies || []}
            onTurnChange={loadCombat}
            isMJ={true}
          />
        )}

        {/* Informations (pour joueurs) */}
        {!isMJ && (
          <div className="combat-info">
            <h3>Combattants ({combat.combatants?.length || 0})</h3>
            <div className="combatants-list">
              {combat.combatants?.map(c => (
                <div key={c.id} className="combatant-info">
                  <span className="name">{c.character.name}</span>
                  <span className="life">
                    {c.character.currentLifePoints}/{c.character.lifePoints}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Informations pour MJ */}
        {isMJ && (
          <div className="combat-info">
            <h3>Combattants ({combat.combatants?.length || 0})</h3>
            <div className="combatants-list">
              {combat.combatants?.map(c => (
                <div key={c.id} className="combatant-info">
                  <span className="name">{c.character.name}</span>
                  <span className="life">
                    {c.character.currentLifePoints}/{c.character.lifePoints}
                  </span>
                </div>
              ))}
            </div>

            <h3>Ennemis ({combat.enemies?.length || 0})</h3>
            <div className="combatants-list">
              {combat.enemies?.map(e => (
                <div key={e.id} className="enemy-info">
                  <span className="name">{e.name}</span>
                  <span className="life">{e.currentLife}/{e.maxLife}</span>
                  <span className="damage">{e.weaponDamage}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Menu contextuel */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'character' && (
            <>
              <button 
                onClick={() => {
                  handleRollInitiative(contextMenu.id);
                }}
                disabled={rollingInitiative === contextMenu.id}
                style={{ backgroundColor: rollingInitiative === contextMenu.id ? '#ccc' : '' }}
              >
                🎲 Lancer Initiative
              </button>
              <button onClick={() => {
                handleRemoveCombatant(contextMenu.id);
                setContextMenu(null);
              }}>
                ✕ Retirer du combat
              </button>
            </>
          )}
          {contextMenu.type === 'enemy' && (
            <>
              <button 
                onClick={() => {
                  handleRollInitiativeEnemy(contextMenu.id);
                }}
                disabled={rollingInitiative === contextMenu.id}
                style={{ backgroundColor: rollingInitiative === contextMenu.id ? '#ccc' : '' }}
              >
                🎲 Lancer Initiative
              </button>
              <button onClick={() => {
                handleRemoveEnemy(contextMenu.id);
                setContextMenu(null);
              }}>
                ✕ Retirer du combat
              </button>
            </>
          )}
          {!contextMenu.type && (
            <button onClick={() => setEnemyForm({ name: '', maxLife: '', weaponDamage: '1d6' })}>
              ➕ Ajouter un ennemi
            </button>
          )}
        </div>
      )}

      {/* Formulaire d'ajout d'ennemi */}
      {enemyForm && (
        <div className="modal-overlay" onClick={() => setEnemyForm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Ajouter un ennemi</h3>
            <input
              type="text"
              placeholder="Nom de l'ennemi"
              value={enemyForm.name}
              onChange={(e) => setEnemyForm({ ...enemyForm, name: e.target.value })}
            />
            <input
              type="number"
              placeholder="Points de vie"
              value={enemyForm.maxLife}
              onChange={(e) => setEnemyForm({ ...enemyForm, maxLife: e.target.value })}
            />
            <input
              type="text"
              placeholder="Dégâts de l'arme (ex: 2d6+1)"
              value={enemyForm.weaponDamage}
              onChange={(e) => setEnemyForm({ ...enemyForm, weaponDamage: e.target.value })}
            />
            <div className="modal-buttons">
              <button className="btn-primary" onClick={handleAddEnemy}>Ajouter</button>
              <button className="btn-secondary" onClick={() => setEnemyForm(null)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Cliquer pour se déplacer */}
      {isMJ && selectedCharacter && (
        <div className="hint">
          Cliquez sur la grille pour déplacer {selectedCharacter.name}
        </div>
      )}

      {/* Overlay contextuel fermable */}
      {contextMenu && (
        <div 
          className="context-menu-overlay"
          onClick={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
