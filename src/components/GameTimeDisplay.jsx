import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

/**
 * Composant pour afficher et modifier l'heure en jeu
 * - Le MJ peut modifier l'heure et la date
 * - Les joueurs peuvent uniquement visualiser
 */
export default function GameTimeDisplay({ gameId, compact = false }) {
  const { user } = useAuth();
  const socket = useSocket();
  const [gameTime, setGameTime] = useState('');
  const [gameDate, setGameDate] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [tempTime, setTempTime] = useState('');
  const [tempDate, setTempDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isMJ = user?.role === 'mj';

  // Charger l'heure en jeu au montage
  useEffect(() => {
    if (gameId) {
      loadGameTime();
    }
  }, [gameId]);

  // Écouter les mises à jour en temps réel via WebSocket
  useEffect(() => {
    if (!socket || !gameId) return;

    const handleGameTimeUpdate = (data) => {
      if (data.gameId === gameId) {
        console.log('[GameTimeDisplay] Mise à jour reçue:', data);
        setGameTime(data.gameTime || '');
        setGameDate(data.gameDate || '');
      }
    };

    socket.on('gameTimeUpdated', handleGameTimeUpdate);

    return () => {
      socket.off('gameTimeUpdated', handleGameTimeUpdate);
    };
  }, [socket, gameId]);

  const loadGameTime = async () => {
    try {
      setLoading(true);
      const data = await apiService.getGameTime(gameId);
      setGameTime(data.gameTime || '');
      setGameDate(data.gameDate || '');
    } catch (error) {
      console.error('Erreur lors du chargement de l\'heure en jeu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = () => {
    setTempTime(gameTime);
    setTempDate(gameDate);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setTempTime('');
    setTempDate('');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiService.updateGameTime(gameId, {
        gameTime: tempTime,
        gameDate: tempDate
      });
      setGameTime(tempTime);
      setGameDate(tempDate);
      setIsEditing(false);
      
      if (window.notificationSystem) {
        window.notificationSystem.success('Heure en jeu mise à jour !');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      if (window.notificationSystem) {
        window.notificationSystem.error('Erreur lors de la mise à jour de l\'heure');
      }
    } finally {
      setSaving(false);
    }
  };

  // Raccourcis rapides pour le MJ
  const quickTimes = [
    { label: 'Aube', value: '06:00' },
    { label: 'Matin', value: '09:00' },
    { label: 'Midi', value: '12:00' },
    { label: 'Après-midi', value: '15:00' },
    { label: 'Soir', value: '18:00' },
    { label: 'Crépuscule', value: '20:00' },
    { label: 'Nuit', value: '22:00' },
    { label: 'Minuit', value: '00:00' },
  ];

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${compact ? 'text-sm' : ''}`}>
        <span className="animate-pulse text-muted">Chargement...</span>
      </div>
    );
  }

  // Mode compact (pour la navbar)
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {gameTime || gameDate ? (
          <span className="text-amber-300 font-medium">
            {gameTime && <span>{gameTime}</span>}
            {gameTime && gameDate && <span className="mx-1">-</span>}
            {gameDate && <span>{gameDate}</span>}
          </span>
        ) : (
          <span className="text-muted italic">Non définie</span>
        )}
        {isMJ && (
          <button
            onClick={handleStartEdit}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title="Modifier l'heure en jeu"
          >
            <svg className="w-3 h-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  // Mode complet (panneau d'info)
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-primary flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Heure en jeu
        </h3>
        {isMJ && !isEditing && (
          <button
            onClick={handleStartEdit}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-amber-400 hover:text-amber-300"
            title="Modifier"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        )}
      </div>

      {isEditing ? (
        // Mode édition (MJ uniquement)
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">
              Heure (ex: 14:30, Aube, Crépuscule)
            </label>
            <input
              type="text"
              value={tempTime}
              onChange={(e) => setTempTime(e.target.value)}
              placeholder="14:30 ou Aube"
              className="w-full p-2 border border-white/20 rounded-lg bg-white/5 text-primary placeholder-muted focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all"
            />
            {/* Raccourcis rapides */}
            <div className="flex flex-wrap gap-1 mt-2">
              {quickTimes.map((qt) => (
                <button
                  key={qt.label}
                  onClick={() => setTempTime(qt.label)}
                  className="px-2 py-1 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded transition-colors"
                >
                  {qt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1">
              Date en jeu (optionnel)
            </label>
            <input
              type="text"
              value={tempDate}
              onChange={(e) => setTempDate(e.target.value)}
              placeholder="15 Vendémiaire, An 3"
              className="w-full p-2 border border-white/20 rounded-lg bg-white/5 text-primary placeholder-muted focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/20 text-white rounded-lg font-medium transition-all"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        // Mode affichage
        <div className="text-center py-4">
          {gameTime || gameDate ? (
            <>
              {gameTime && (
                <div className="text-3xl font-bold text-amber-400 mb-1">
                  {gameTime}
                </div>
              )}
              {gameDate && (
                <div className="text-lg text-secondary">
                  {gameDate}
                </div>
              )}
            </>
          ) : (
            <div className="text-muted italic">
              {isMJ ? (
                <span>Cliquez sur le crayon pour définir l'heure en jeu</span>
              ) : (
                <span>Le MJ n'a pas encore défini l'heure en jeu</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Indicateur de synchronisation */}
      <div className="mt-3 pt-3 border-t border-white/10 text-xs text-muted flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        Synchronisé en temps réel
      </div>
    </div>
  );
}
