import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useGame } from '../context/GameContext';
import apiService from '../services/api';
import '../styles/TurnManager.css';

const TurnManager = ({ combat, combatants, enemies, onTurnChange, isMJ = false }) => {
  const socket = useSocket();
  const { currentGame } = useGame();
  const gameId = currentGame?.id;
  const [selectedAttacker, setSelectedAttacker] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [attackerType, setAttackerType] = useState('character');
  const [targetType, setTargetType] = useState('character');
  const [isRolling, setIsRolling] = useState(false);
  const [combatLog, setCombatLog] = useState([]);

  if (!combat) {
    return <div className="turn-manager no-combat">Aucun combat en cours</div>;
  }

  // Créer la liste d'ordre d'initiative
  const initiativeOrder = [
    ...combatants.map(c => ({
      id: c.id,
      type: 'character',
      name: c.character?.name || 'Personnage inconnu',
      order: c.order || 999,
      hasActed: c.hasActed,
      health: c.currentHealth,
      maxHealth: c.character?.lifePoints || 20,
      reflexes: c.character?.reflexes || 50,
      closeCombat: c.character?.closeCombat || 50,
      dodge: c.character?.dodge || 50
    })),
    ...enemies.map(e => ({
      id: e.id,
      type: 'enemy',
      name: e.name,
      order: e.order || 999,
      hasActed: e.hasActed,
      health: e.currentLife,
      maxHealth: e.maxLife,
      reflexes: e.reflexes || 50,
      closeCombat: e.reflexes || 50,
      dodge: e.reflexes || 50
    }))
  ].sort((a, b) => a.order - b.order);

  // Trouver le participant actuel
  const currentParticipant = initiativeOrder.find(p => !p.hasActed);

  const handleAttack = async () => {
    if (!selectedAttacker || !selectedTarget || selectedAttacker === selectedTarget) {
      alert('Veuillez sélectionner un attaquant et une cible différents');
      return;
    }

    setIsRolling(true);
    try {
      const result = await apiService.attack(
        combat.id,
        selectedAttacker,
        selectedTarget,
        attackerType,
        targetType
      );

      // Ajouter l'action au journal
      const attacker = initiativeOrder.find(p => p.id === selectedAttacker);
      const target = initiativeOrder.find(p => p.id === selectedTarget);

      let actionText = `⚔️ ${attacker.name} attaque ${target.name}`;
      
      if (result.action.isCritical) {
        actionText += ` 🎯 CRITIQUE (${result.action.attackRoll}!)`;
      } else if (result.action.isFumble) {
        actionText += ` 💥 FUMBLE (${result.action.attackRoll}!)`;
      } else if (result.action.attackSuccess) {
        if (result.action.defenseSuccess) {
          actionText += ` - 🛡️ Défense réussie!`;
        } else {
          actionText += ` - 💢 Touche! ${result.action.damage} dégâts`;
        }
      } else {
        actionText += ` - 🏹 Raté!`;
      }

      setCombatLog(prev => [actionText, ...prev.slice(0, 9)]);

      // Notifier les autres joueurs
      socket?.emit('combatAction', {
        gameId,
        combatId: combat.id,
        action: result.action,
        attacker: attacker.name,
        target: target.name
      });

      // Réinitialiser les sélections
      setSelectedAttacker(null);
      setSelectedTarget(null);

      // Si MJ, afficher option pour passer au tour suivant
      if (isMJ) {
        setTimeout(() => {
          const goNext = window.confirm('Passer au tour suivant?');
          if (goNext) {
            handleNextTurn();
          }
        }, 500);
      }
    } catch (error) {
      console.error('Erreur lors de l\'attaque:', error);
      alert('Erreur lors de l\'attaque: ' + error.message);
    } finally {
      setIsRolling(false);
    }
  };

  const handleNextTurn = async () => {
    try {
      setIsRolling(true);
      const result = await apiService.nextTurn(combat.id);
      
      setCombatLog(prev => [
        `📍 Tour ${result.currentRound}: ${result.nextTurn.name} agit`,
        ...prev.slice(0, 9)
      ]);

      if (onTurnChange) {
        onTurnChange(result);
      }

      socket?.emit('turnChanged', {
        gameId,
        combatId: combat.id,
        currentRound: result.currentRound,
        nextTurn: result.nextTurn
      });
    } catch (error) {
      console.error('Erreur lors du passage au tour:', error);
      alert('Erreur lors du passage au tour: ' + error.message);
    } finally {
      setIsRolling(false);
    }
  };

  return (
    <div className="turn-manager">
      {/* En-tête avec info du combat */}
      <div className="combat-header">
        <h2>⚔️ Tour {combat.currentRound}</h2>
        <div className="combat-status">
          {currentParticipant && (
            <span className="current-turn">
              🎯 C'est au tour de: <strong>{currentParticipant.name}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Ordre d'initiative */}
      <div className="initiative-order">
        <h3>📊 Ordre d'Initiative</h3>
        <div className="order-list">
          {initiativeOrder.map((participant, index) => (
            <div
              key={participant.id}
              className={`order-item ${participant.type} ${participant.hasActed ? 'acted' : ''} ${
                currentParticipant?.id === participant.id ? 'current' : ''
              }`}
            >
              <span className="order-number">{index + 1}</span>
              <span className="name">{participant.name}</span>
              <span className="health">
                {participant.health}/{participant.maxHealth} ❤️
              </span>
              {participant.hasActed && <span className="acted-badge">✓</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Interface d'attaque (seulement pour MJ) */}
      {isMJ && (
        <div className="combat-actions">
          <h3>🎮 Actions du Maître de Jeu</h3>
          
          <div className="action-panel">
            <div className="selector-group">
              <div className="selector">
                <label>Attaquant:</label>
                <select 
                  value={selectedAttacker || ''} 
                  onChange={(e) => {
                    setSelectedAttacker(e.target.value);
                    setAttackerType('character');
                  }}
                >
                  <option value="">-- Sélectionner --</option>
                  {combatants.map(c => (
                    <option key={`char-${c.id}`} value={c.id}>
                      {c.character?.name} (Combat: {c.character?.closeCombat || 50}%)
                    </option>
                  ))}
                  {enemies.map(e => (
                    <option key={`enemy-${e.id}`} value={e.id}>
                      {e.name} (Combat: {e.reflexes || 50}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className="selector">
                <label>Cible:</label>
                <select 
                  value={selectedTarget || ''} 
                  onChange={(e) => {
                    setSelectedTarget(e.target.value);
                    setTargetType('character');
                  }}
                >
                  <option value="">-- Sélectionner --</option>
                  {combatants.map(c => (
                    <option key={`char-${c.id}`} value={c.id}>
                      {c.character?.name} (Combat: {c.character?.closeCombat || 50}%)
                    </option>
                  ))}
                  {enemies.map(e => (
                    <option key={`enemy-${e.id}`} value={e.id}>
                      {e.name} (Combat: {e.reflexes || 50}%)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="action-buttons">
              <button
                className="btn-attack"
                onClick={handleAttack}
                disabled={isRolling || !selectedAttacker || !selectedTarget}
              >
                {isRolling ? '🎲 En cours...' : '⚔️ Lancer Attaque'}
              </button>
              <button
                className="btn-next-turn"
                onClick={handleNextTurn}
                disabled={isRolling || !currentParticipant?.hasActed}
              >
                {isRolling ? '⏳ En cours...' : '➡️ Prochain Tour'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Journal de combat */}
      <div className="combat-log">
        <h3>📜 Journal de Combat</h3>
        <div className="log-entries">
          {combatLog.length === 0 ? (
            <div className="no-entries">Aucune action pour le moment...</div>
          ) : (
            combatLog.map((entry, index) => (
              <div key={index} className="log-entry">
                {entry}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Info participant actuel */}
      {currentParticipant && (
        <div className="current-participant-info">
          <h3>ℹ️ Infos du Tour</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Participant:</span>
              <span className="value">{currentParticipant.name}</span>
            </div>
            <div className="info-item">
              <span className="label">Santé:</span>
              <span className="value">{currentParticipant.health}/{currentParticipant.maxHealth}</span>
            </div>
            <div className="info-item">
              <span className="label">Réflexes:</span>
              <span className="value">{currentParticipant.reflexes}%</span>
            </div>
            <div className="info-item">
              <span className="label">Combat Rapproché:</span>
              <span className="value">{currentParticipant.closeCombat}%</span>
            </div>
            <div className="info-item">
              <span className="label">Esquive:</span>
              <span className="value">{currentParticipant.dodge}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TurnManager;
