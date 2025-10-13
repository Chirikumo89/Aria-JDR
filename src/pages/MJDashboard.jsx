import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiService } from '../services/api';
import CharacterSheet from '../components/CharacterSheet';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function MJDashboard() {
  const { gameId } = useParams();
  const { user } = useAuth();
  const socket = useSocket();
  const [characters, setCharacters] = useState([]);
  const [selectedCharacters, setSelectedCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Vérifier que l'utilisateur est MJ
  const isMJ = user?.role === 'mj';

  // Fonction utilitaire pour comparer les personnages
  const compareCharacters = (oldChars, newChars) => {
    if (oldChars.length !== newChars.length) return true;
    
    return oldChars.some((oldChar, index) => {
      const newChar = newChars[index];
      if (!newChar || oldChar.id !== newChar.id) return true;
      
      // Comparer les champs importants
      const importantFields = ['name', 'lifePoints', 'wounds', 'protection', 'crowns', 'orbs', 'scepters', 'kings'];
      return importantFields.some(field => oldChar[field] !== newChar[field]);
    });
  };

  useEffect(() => {
    if (gameId && isMJ) {
      loadCharacters(true); // Chargement initial
      
      // Polling de secours toutes les 15 secondes pour vérifier les mises à jour
      const pollingInterval = setInterval(() => {
        console.log('[MJDashboard] Polling de secours...');
        loadCharacters(false); // Mise à jour normale
      }, 15000);
      
      return () => clearInterval(pollingInterval);
    }
  }, [gameId, isMJ]);

  // Écouter les mises à jour en temps réel via WebSocket
  useEffect(() => {
    if (!socket || !gameId) return;

    console.log('[MJDashboard] Socket disponible:', !!socket);
    console.log('[MJDashboard] Socket connecté:', socket.connected);
    console.log('[MJDashboard] Écoute des mises à jour pour la partie:', gameId);

    // Écouter les mises à jour de personnages
    const handleCharacterUpdate = (updatedCharacter) => {
      console.log('[MJDashboard] Personnage mis à jour:', updatedCharacter.name);
      
      // Mettre à jour dans la liste principale
      setCharacters(prev => 
        prev.map(char => 
          char.id === updatedCharacter.id ? updatedCharacter : char
        )
      );
      
      // Mettre à jour dans les personnages sélectionnés
      setSelectedCharacters(prev => 
        prev.map(char => 
          char.id === updatedCharacter.id ? updatedCharacter : char
        )
      );
      
      // Mettre à jour le timestamp
      setLastUpdateTime(new Date());
    };

    // Écouter les nouveaux personnages
    const handleCharacterCreated = (newCharacter) => {
      console.log('[MJDashboard] Nouveau personnage créé:', newCharacter.name);
      setCharacters(prev => [...prev, newCharacter]);
    };

    // Écouter les suppressions de personnages
    const handleCharacterDeleted = (deletedCharacterId) => {
      console.log('[MJDashboard] Personnage supprimé:', deletedCharacterId);
      setCharacters(prev => prev.filter(char => char.id !== deletedCharacterId));
      setSelectedCharacters(prev => prev.filter(char => char.id !== deletedCharacterId));
    };

    // S'abonner aux événements
    socket.on('characterUpdated', handleCharacterUpdate);
    socket.on('characterCreated', handleCharacterCreated);
    socket.on('characterDeleted', handleCharacterDeleted);
    
    // Test de connexion
    socket.on('connect', () => {
      console.log('[MJDashboard] Socket connecté !');
    });
    
    socket.on('disconnect', () => {
      console.log('[MJDashboard] Socket déconnecté !');
    });

    // Nettoyage
    return () => {
      socket.off('characterUpdated', handleCharacterUpdate);
      socket.off('characterCreated', handleCharacterCreated);
      socket.off('characterDeleted', handleCharacterDeleted);
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [socket, gameId]);

  const loadCharacters = async (isInitialLoad = false) => {
    try {
      // Éviter les mises à jour simultanées
      if (isUpdating && !isInitialLoad) {
        console.log('[MJDashboard] Mise à jour déjà en cours, ignorée');
        return;
      }
      
      setIsUpdating(true);
      
      // Sauvegarder la position de scroll
      const scrollPosition = window.scrollY;
      
      const charactersData = await apiService.getCharacters(gameId);
      
      // Vérifier s'il y a des modifications avec comparaison intelligente
      const hasChanges = compareCharacters(characters, charactersData);
      
      if (hasChanges || isInitialLoad) {
        console.log('[MJDashboard] Modifications détectées, mise à jour des données');
        setCharacters(charactersData);
        setLastUpdateTime(new Date());
        
        // Sélectionner automatiquement les 4 premiers personnages seulement au chargement initial
        if (isInitialLoad && charactersData.length > 0) {
          const initialSelection = charactersData.slice(0, 4);
          setSelectedCharacters(initialSelection);
        }
        
        // Restaurer la position de scroll après un court délai
        setTimeout(() => {
          window.scrollTo(0, scrollPosition);
        }, 100);
      } else {
        console.log('[MJDashboard] Aucune modification détectée, pas de mise à jour');
      }
      
      if (isInitialLoad) {
        setLoading(false);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des personnages:', error);
      setError('Erreur lors du chargement des personnages');
      if (isInitialLoad) {
        setLoading(false);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCharacterToggle = (character) => {
    setSelectedCharacters(prev => {
      const isSelected = prev.some(c => c.id === character.id);
      
      if (isSelected) {
        // Retirer le personnage
        return prev.filter(c => c.id !== character.id);
      } else {
        // Ajouter le personnage (max 4)
        if (prev.length >= 4) {
          return prev;
        }
        return [...prev, character];
      }
    });
  };

  const handleCharacterUpdate = (updatedCharacter) => {
    // Mettre à jour le personnage dans la liste
    setCharacters(prev => 
      prev.map(char => 
        char.id === updatedCharacter.id ? updatedCharacter : char
      )
    );
    
    // Mettre à jour aussi dans les personnages sélectionnés
    setSelectedCharacters(prev => 
      prev.map(char => 
        char.id === updatedCharacter.id ? updatedCharacter : char
      )
    );
  };

  if (!isMJ) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-ink mb-4">Accès refusé</h1>
          <p className="text-ink/70">Seuls les Maîtres de Jeu peuvent accéder à cette page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🎲</div>
          <p className="text-ink/70">Chargement des personnages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-ink mb-4">Erreur</h1>
          <p className="text-ink/70 mb-4">{error}</p>
          <button 
            onClick={loadCharacters}
            className="px-4 py-2 bg-ink text-parchment rounded hover:bg-ink/80"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment">
      {/* Header */}
      <div className="bg-ink text-parchment p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">🎭 Table de Maître</h1>
            <p className="text-parchment/80">Surveillance des fiches de personnages</p>
          </div>
          <div className="text-sm space-y-1">
            <div>
              <span className="bg-parchment/20 px-2 py-1 rounded">
                {selectedCharacters.length}/4 personnages sélectionnés
              </span>
            </div>
            {lastUpdateTime && (
              <div className="text-xs text-parchment/70">
                Dernière mise à jour: {lastUpdateTime.toLocaleTimeString('fr-FR')}
              </div>
            )}
            {isUpdating && (
              <div className="text-xs text-parchment/70">
                🔄 Mise à jour en cours...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sélection des personnages */}
      <div className="bg-parchment/50 border-b border-ink/20 p-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-lg font-bold text-ink mb-3">Sélectionner les personnages à surveiller</h2>
          <div className="flex flex-wrap gap-2">
            {characters.map(character => {
              const isSelected = selectedCharacters.some(c => c.id === character.id);
              const isDisabled = !isSelected && selectedCharacters.length >= 4;
              
              return (
                <button
                  key={character.id}
                  onClick={() => handleCharacterToggle(character)}
                  disabled={isDisabled}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    isSelected 
                      ? 'bg-ink text-parchment' 
                      : isDisabled 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-parchment text-ink border-2 border-ink hover:bg-ink hover:text-parchment'
                  }`}
                >
                  {character.name} ({character.playerName})
                </button>
              );
            })}
          </div>
          {characters.length === 0 && (
            <p className="text-ink/70 italic">Aucun personnage trouvé dans cette partie.</p>
          )}
        </div>
      </div>

      {/* Affichage des fiches */}
      <div className="p-4">
        <div className="max-w-7xl mx-auto">
          {selectedCharacters.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-bold text-ink mb-2">Aucun personnage sélectionné</h3>
              <p className="text-ink/70">Sélectionnez jusqu'à 4 personnages pour commencer la surveillance.</p>
            </div>
          ) : (
            <div className={`grid gap-4 ${
              selectedCharacters.length === 1 ? 'grid-cols-1 max-w-2xl mx-auto' :
              selectedCharacters.length === 2 ? 'grid-cols-1 lg:grid-cols-2' :
              selectedCharacters.length === 3 ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' :
              'grid-cols-1 lg:grid-cols-2 xl:grid-cols-4'
            }`}>
              {selectedCharacters.map(character => (
                <div key={character.id} className="relative">
                  {/* Indicateur de statut */}
                  <div className="absolute top-2 right-2 z-10">
                    <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      En ligne
                    </div>
                  </div>
                  
                  {/* Fiche de personnage */}
                  <div className="bg-parchment border-2 border-ink rounded-lg shadow-lg overflow-hidden">
                    <CharacterSheet
                      character={character}
                      onSave={handleCharacterUpdate}
                      isEditable={false} // Mode lecture seule pour le MJ
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer avec informations */}
      <div className="bg-ink/10 border-t border-ink/20 p-4 mt-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-ink/70">
            💡 <strong>Astuce :</strong> Les fiches se mettent à jour automatiquement quand les joueurs modifient leurs personnages.
          </p>
        </div>
      </div>
    </div>
  );
}
