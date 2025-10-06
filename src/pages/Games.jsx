import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import CardManager from '../components/Cards/CardManager';

export default function Games() {
  const { 
    games, 
    currentGame, 
    characters, 
    loading, 
    error, 
    createGame, 
    deleteGame,
    selectGame, 
    createCharacter,
    deleteCharacter
  } = useGame();
  const socket = useSocket();
  const { user, isAuthenticated } = useAuth();
  const { canDeleteGame, isMJ, canCreateCharacter, canDeleteCharacter } = usePermissions();
  
  const [showCreateGame, setShowCreateGame] = useState(false);
  const [showCreateCharacter, setShowCreateCharacter] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [gameToDelete, setGameToDelete] = useState(null);
  const [showDeleteCharacterConfirm, setShowDeleteCharacterConfirm] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState(null);
  const [newGame, setNewGame] = useState({ name: '', description: '' });
  const [newCharacter, setNewCharacter] = useState({
    name: ''
  });
  const [activeTab, setActiveTab] = useState('characters'); // 'characters' ou 'cards'

  const handleCreateGame = async (e) => {
    e.preventDefault();
    try {
      await createGame(newGame);
      setNewGame({ name: '', description: '' });
      setShowCreateGame(false);
    } catch (err) {
      console.error('Erreur lors de la création de la partie:', err);
    }
  };

  const handleCreateCharacter = async (e) => {
    e.preventDefault();
    try {
      await createCharacter(newCharacter);
      setNewCharacter({ name: '' });
      setShowCreateCharacter(false);
      if (window.notificationSystem) {
        window.notificationSystem.success('Personnage créé avec succès !');
      }
    } catch (err) {
      console.error('Erreur lors de la création du personnage:', err);
      if (window.notificationSystem) {
        window.notificationSystem.error('Erreur lors de la création du personnage: ' + err.message);
      }
    }
  };

  const handleDeleteGame = (game) => {
    console.log('handleDeleteGame called with:', game);
    setGameToDelete(game);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteGame = async () => {
    if (!gameToDelete || !user) return;
    
    console.log('confirmDeleteGame called for game:', gameToDelete.id);
    try {
      await deleteGame(gameToDelete.id, user.id);
      console.log('Game deleted successfully');
      setShowDeleteConfirm(false);
      setGameToDelete(null);
      if (window.notificationSystem) {
        window.notificationSystem.success('Partie supprimée avec succès !');
      }
    } catch (err) {
      console.error('Erreur lors de la suppression de la partie:', err);
      if (window.notificationSystem) {
        window.notificationSystem.error('Erreur lors de la suppression de la partie: ' + err.message);
      }
    }
  };

  const cancelDeleteGame = () => {
    setShowDeleteConfirm(false);
    setGameToDelete(null);
  };

  const handleDeleteCharacter = (character) => {
    setCharacterToDelete(character);
    setShowDeleteCharacterConfirm(true);
  };

  const confirmDeleteCharacter = async () => {
    if (!characterToDelete) return;
    
    try {
      await deleteCharacter(characterToDelete.id);
      setShowDeleteCharacterConfirm(false);
      setCharacterToDelete(null);
      if (window.notificationSystem) {
        window.notificationSystem.success('Personnage supprimé avec succès !');
      }
    } catch (err) {
      console.error('Erreur lors de la suppression du personnage:', err);
      if (window.notificationSystem) {
        window.notificationSystem.error('Erreur lors de la suppression du personnage: ' + err.message);
      }
    }
  };

  const cancelDeleteCharacter = () => {
    setShowDeleteCharacterConfirm(false);
    setCharacterToDelete(null);
  };

  const handleDiceRoll = (type) => {
    if (socket && currentGame) {
      socket.emit('dice:roll', {
        type,
        player: user?.username || 'Joueur anonyme',
        gameId: currentGame.id,
        userId: user?.id
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">Erreur: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-primary min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-primary">Gestion des Parties</h1>
      
      {/* Liste des parties */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {games.map(game => (
          <div 
            key={game.id} 
            className={`p-6 border rounded-lg transition-all duration-200 shadow-card ${
              currentGame?.id === game.id 
                ? 'border-blue-500 bg-blue-500/10 shadow-lg' 
                : 'border-primary bg-card hover:border-secondary hover:shadow-lg'
            }`}
          >
            <div onClick={() => selectGame(game)} className="cursor-pointer">
              <h3 className="text-xl font-semibold mb-2 text-primary">{game.name}</h3>
              <p className="text-secondary mb-4">{game.description || 'Aucune description'}</p>
              <div className="text-sm text-muted">
                <p>Personnages: {game._count?.characters || 0}</p>
                <p>Lancers de dés: {game._count?.diceRolls || 0}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => selectGame(game)}
                className="px-3 py-1 bg-amber-600 text-white text-sm rounded hover:bg-amber-700 transition-colors duration-200 font-medium"
              >
                Ouvrir
              </button>
              {canDeleteGame(game) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteGame(game);
                  }}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors duration-200"
                >
                  Supprimer
                </button>
              )}
            </div>
          </div>
        ))}
        
        {/* Bouton pour créer une nouvelle partie - Seulement pour MJ */}
        {isMJ() && (
          <div 
            className="p-6 border-2 border-dashed border-primary rounded-lg cursor-pointer hover:border-secondary hover:bg-hover flex items-center justify-center transition-all duration-200"
            onClick={() => setShowCreateGame(true)}
          >
            <div className="text-center">
              <div className="text-4xl mb-2 text-primary">+</div>
              <div className="text-secondary">Nouvelle partie</div>
            </div>
          </div>
        )}
      </div>

      {/* Partie sélectionnée */}
      {currentGame && (
        <div className="bg-card p-6 rounded-lg shadow-card border border-primary">
          <h2 className="text-2xl font-bold mb-4 text-primary">{currentGame.name}</h2>
          
          {/* Onglets */}
          <div className="flex border-b border-primary mb-6">
            <button
              onClick={() => setActiveTab('characters')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'characters'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              Personnages
            </button>
            <button
              onClick={() => setActiveTab('cards')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'cards'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              Cartes
            </button>
          </div>

          {/* Contenu des onglets */}
          {activeTab === 'characters' && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-primary">Personnages</h3>
                {/* Vérifier si l'utilisateur peut créer un personnage et n'en a pas déjà un */}
                {canCreateCharacter() && !characters.some(char => char.userId === user?.id) && (
                  <button 
                    className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors duration-200 font-medium"
                    onClick={() => setShowCreateCharacter(true)}
                  >
                    Ajouter un personnage
                  </button>
                )}
              </div>
            
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {characters.map(character => (
                  <div key={character.id} className="p-4 border border-primary rounded-lg bg-card hover:bg-hover transition-colors duration-200">
                    <h4 className="font-semibold text-primary">{character.name}</h4>
                    <p className="text-sm text-secondary">Joué par: {character.playerName}</p>
                    <p className="text-sm text-secondary">Niveau: {character.level}</p>
                    {character.class && <p className="text-sm text-secondary">Classe: {character.class}</p>}
                    {character.race && <p className="text-sm text-secondary">Race: {character.race}</p>}
                    <div className="mt-3 flex gap-2">
                      <Link
                        to={`/character/${character.id}`}
                        className="inline-block px-3 py-1 bg-amber-600 text-white text-sm rounded hover:bg-amber-700 transition-colors duration-200 font-medium"
                      >
                        Voir la fiche
                      </Link>
                      {canDeleteCharacter(character) && (
                        <button
                          onClick={() => handleDeleteCharacter(character)}
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors duration-200"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'cards' && (
            <div className="mb-8">
              <CardManager 
                gameId={currentGame.id} 
                characters={characters}
              />
            </div>
          )}

          {activeTab === 'dice' && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-primary">Lancers de dés</h3>
              <div className="flex gap-4 mb-4">
                <button 
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors duration-200"
                  onClick={() => handleDiceRoll('d6')}
                >
                  Lancer D6
                </button>
                <button 
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors duration-200"
                  onClick={() => handleDiceRoll('d100')}
                >
                  Lancer D100
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modales */}
      {showCreateGame && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg w-96 border border-primary shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-primary">Nouvelle partie</h3>
            <form onSubmit={handleCreateGame}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-primary">Nom de la partie</label>
                <input
                  type="text"
                  value={newGame.name}
                  onChange={(e) => setNewGame({...newGame, name: e.target.value})}
                  className="w-full p-2 border border-primary rounded bg-card text-primary placeholder-muted"
                  placeholder="Entrez le nom de la partie"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-primary">Description</label>
                <textarea
                  value={newGame.description}
                  onChange={(e) => setNewGame({...newGame, description: e.target.value})}
                  className="w-full p-2 border border-primary rounded bg-card text-primary placeholder-muted"
                  placeholder="Description de la partie (optionnel)"
                  rows="3"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors duration-200 font-medium">
                  Créer
                </button>
                <button 
                  type="button" 
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors duration-200"
                  onClick={() => setShowCreateGame(false)}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateCharacter && currentGame && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg w-96 border border-primary shadow-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4 text-primary">Nouveau personnage</h3>
            <form onSubmit={handleCreateCharacter}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-primary">Nom du personnage</label>
                <input
                  type="text"
                  value={newCharacter.name}
                  onChange={(e) => setNewCharacter({...newCharacter, name: e.target.value})}
                  className="w-full p-2 border border-primary rounded bg-card text-primary placeholder-muted"
                  placeholder="Nom du personnage"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-primary">Nom du joueur</label>
                <input
                  type="text"
                  value={user?.username || ''}
                  className="w-full p-2 border border-primary rounded bg-card text-primary placeholder-muted"
                  disabled
                  placeholder="Nom du joueur (automatique)"
                />
                <p className="text-xs text-muted mt-1">Le nom du joueur est automatiquement rempli</p>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors duration-200 font-medium">
                  Créer
                </button>
                <button 
                  type="button" 
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors duration-200"
                  onClick={() => setShowCreateCharacter(false)}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression de partie */}
      {showDeleteConfirm && gameToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg w-96 border border-primary shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-primary">Confirmer la suppression</h3>
            <p className="text-secondary mb-4">
              Êtes-vous sûr de vouloir supprimer la partie "{gameToDelete.name}" ? 
              Cette action supprimera également tous les personnages et lancers de dés associés.
            </p>
            <div className="bg-amber-100 border border-amber-300 rounded p-3 mb-4">
              <p className="text-amber-800 text-sm">
                ⚠️ <strong>Attention :</strong> Seuls les Maîtres de Jeu peuvent supprimer des parties.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={confirmDeleteGame}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-200"
              >
                Supprimer
              </button>
              <button
                onClick={cancelDeleteGame}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors duration-200"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression de personnage */}
      {showDeleteCharacterConfirm && characterToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg w-96 border border-primary shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-primary">Confirmer la suppression</h3>
            <p className="text-secondary mb-4">
              Êtes-vous sûr de vouloir supprimer le personnage "{characterToDelete.name}" ? 
              Cette action est irréversible.
            </p>
            <div className="bg-amber-100 border border-amber-300 rounded p-3 mb-4">
              <p className="text-amber-800 text-sm">
                ⚠️ <strong>Attention :</strong> Seuls le propriétaire du personnage ou le MJ peuvent le supprimer.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={confirmDeleteCharacter}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-200"
              >
                Supprimer
              </button>
              <button
                onClick={cancelDeleteCharacter}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors duration-200"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
