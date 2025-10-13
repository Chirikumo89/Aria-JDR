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
    <div className="container mx-auto px-4 py-8 min-h-screen">
      {/* Header avec gradient */}
      <div className="mb-12 animate-fadeIn">
        <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
          Gestion des Parties
        </h1>
        <p className="text-secondary text-lg">Créez et gérez vos parties de jeu de rôle</p>
      </div>

      {/* Liste des parties */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {games.map((game, index) => (
          <div
            key={game.id}
            className={`group relative p-6 rounded-2xl transition-all duration-300 backdrop-blur-sm animate-fadeIn ${
              currentGame?.id === game.id
                ? 'bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-2 border-purple-500/50 shadow-xl shadow-purple-500/20 scale-105'
                : 'bg-white/5 border border-white/10 hover:border-purple-500/30 hover:bg-white/10 hover:scale-105 hover:shadow-xl'
            }`}
            style={{animationDelay: `${index * 0.1}s`}}
          >
            {/* Badge "Partie active" */}
            {currentGame?.id === game.id && (
              <div className="absolute -top-3 -right-3 px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-xs font-semibold text-white shadow-lg animate-pulse">
                Partie active
              </div>
            )}

            <div onClick={() => selectGame(game)} className="cursor-pointer">
              {/* Icône de jeu */}
              <div className="mb-4 p-3 w-fit rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>

              <h3 className="text-xl font-bold mb-2 text-primary group-hover:text-purple-400 transition-colors duration-300">
                {game.name}
              </h3>
              <p className="text-secondary mb-4 text-sm line-clamp-2">
                {game.description || 'Aucune description'}
              </p>

              {/* Stats */}
              <div className="flex gap-4 text-sm text-muted mb-4">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span>{game._count?.characters || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                  </svg>
                  <span>{game._count?.diceRolls || 0}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => selectGame(game)}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-sm rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/30"
              >
                Ouvrir
              </button>
              {canDeleteGame(game) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteGame(game);
                  }}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 text-sm rounded-xl font-semibold transition-all duration-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Bouton pour créer une nouvelle partie - Seulement pour MJ */}
        {isMJ() && (
          <div
            className="group relative p-6 border-2 border-dashed border-purple-500/30 hover:border-purple-500/60 rounded-2xl cursor-pointer hover:bg-purple-500/5 flex items-center justify-center transition-all duration-300 hover:scale-105 backdrop-blur-sm animate-fadeIn"
            onClick={() => setShowCreateGame(true)}
            style={{animationDelay: `${games.length * 0.1}s`}}
          >
            <div className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="text-secondary font-semibold">Nouvelle partie</div>
            </div>
          </div>
        )}
      </div>

      {/* Partie sélectionnée */}
      {currentGame && (
        <div className="relative p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl animate-scaleIn">
          {/* En-tête de la partie */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
                {currentGame.name}
              </h2>
              <p className="text-secondary">Partie en cours</p>
            </div>
            {/* Bouton Dashboard MJ */}
            {isMJ() && (
              <Link
                to={`/mj/${currentGame.id}`}
                className="group relative px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-purple-500/50 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Table de Maître
              </Link>
            )}
          </div>

          {/* Onglets modernes */}
          <div className="flex gap-2 border-b border-white/10 mb-8">
            <button
              onClick={() => setActiveTab('characters')}
              className={`relative px-6 py-3 font-semibold rounded-t-xl transition-all duration-300 ${
                activeTab === 'characters'
                  ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-400 border-b-2 border-purple-500'
                  : 'text-secondary hover:text-primary hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Personnages
              </span>
            </button>
            <button
              onClick={() => setActiveTab('cards')}
              className={`relative px-6 py-3 font-semibold rounded-t-xl transition-all duration-300 ${
                activeTab === 'cards'
                  ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-400 border-b-2 border-purple-500'
                  : 'text-secondary hover:text-primary hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Cartes
              </span>
            </button>
          </div>

          {/* Contenu des onglets */}
          {activeTab === 'characters' && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-primary flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Personnages
                </h3>
                {/* Vérifier si l'utilisateur peut créer un personnage et n'en a pas déjà un */}
                {canCreateCharacter() && !characters.some(char => char.userId === user?.id) && (
                  <button
                    className="group relative px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-amber-500/30 flex items-center gap-2"
                    onClick={() => setShowCreateCharacter(true)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Ajouter un personnage
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {characters.map((character, index) => (
                  <div
                    key={character.id}
                    className="group relative p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-purple-500/30 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fadeIn"
                    style={{animationDelay: `${index * 0.1}s`}}
                  >
                    {/* Avatar */}
                    <div className="mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>

                    <h4 className="text-lg font-bold text-primary mb-2 group-hover:text-purple-400 transition-colors duration-300">
                      {character.name}
                    </h4>

                    <div className="space-y-1.5 mb-4">
                      <p className="text-sm text-secondary flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {character.playerName}
                      </p>
                      <p className="text-sm text-secondary flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Niveau {character.level}
                      </p>
                      {character.class && (
                        <p className="text-sm text-secondary flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                          {character.class}
                        </p>
                      )}
                      {character.race && (
                        <p className="text-sm text-secondary flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          {character.race}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Link
                        to={`/character/${character.id}`}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-sm rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/30 text-center"
                      >
                        Voir la fiche
                      </Link>
                      {canDeleteCharacter(character) && (
                        <button
                          onClick={() => handleDeleteCharacter(character)}
                          className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 text-sm rounded-xl font-semibold transition-all duration-300"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl w-full max-w-md border border-white/20 shadow-2xl animate-scaleIn">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-primary">Nouvelle partie</h3>
            </div>
            <form onSubmit={handleCreateGame}>
              <div className="mb-5">
                <label className="block text-sm font-semibold mb-2 text-primary">Nom de la partie</label>
                <input
                  type="text"
                  value={newGame.name}
                  onChange={(e) => setNewGame({...newGame, name: e.target.value})}
                  className="w-full p-3 border border-white/20 rounded-xl bg-white/5 text-primary placeholder-muted focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                  placeholder="Entrez le nom de la partie"
                  required
                  autoFocus
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2 text-primary">Description</label>
                <textarea
                  value={newGame.description}
                  onChange={(e) => setNewGame({...newGame, description: e.target.value})}
                  className="w-full p-3 border border-white/20 rounded-xl bg-white/5 text-primary placeholder-muted focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 resize-none"
                  placeholder="Description de la partie (optionnel)"
                  rows="3"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-purple-500/50"
                >
                  Créer
                </button>
                <button
                  type="button"
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 text-white rounded-xl font-semibold transition-all duration-300"
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl w-full max-w-md border border-white/20 shadow-2xl max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-primary">Nouveau personnage</h3>
            </div>
            <form onSubmit={handleCreateCharacter}>
              <div className="mb-5">
                <label className="block text-sm font-semibold mb-2 text-primary">Nom du personnage</label>
                <input
                  type="text"
                  value={newCharacter.name}
                  onChange={(e) => setNewCharacter({...newCharacter, name: e.target.value})}
                  className="w-full p-3 border border-white/20 rounded-xl bg-white/5 text-primary placeholder-muted focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                  placeholder="Nom du personnage"
                  required
                  autoFocus
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2 text-primary">Nom du joueur</label>
                <input
                  type="text"
                  value={user?.username || ''}
                  className="w-full p-3 border border-white/20 rounded-xl bg-white/5 text-primary placeholder-muted opacity-60 cursor-not-allowed"
                  disabled
                  placeholder="Nom du joueur (automatique)"
                />
                <p className="text-xs text-muted mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Le nom du joueur est automatiquement rempli
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-amber-500/50"
                >
                  Créer
                </button>
                <button
                  type="button"
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 text-white rounded-xl font-semibold transition-all duration-300"
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl w-full max-w-md border border-white/20 shadow-2xl animate-scaleIn">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-red-500/20">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-primary">Confirmer la suppression</h3>
            </div>
            <p className="text-secondary mb-4 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer la partie <span className="font-semibold text-primary">"{gameToDelete.name}"</span> ?
            </p>
            <p className="text-secondary mb-6 text-sm">
              Cette action supprimera également tous les personnages et lancers de dés associés.
            </p>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
              <p className="text-amber-300 text-sm flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span><strong>Attention :</strong> Seuls les Maîtres de Jeu peuvent supprimer des parties. Cette action est irréversible.</span>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={confirmDeleteGame}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-red-500/50"
              >
                Supprimer
              </button>
              <button
                onClick={cancelDeleteGame}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 text-white rounded-xl font-semibold transition-all duration-300"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression de personnage */}
      {showDeleteCharacterConfirm && characterToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl w-full max-w-md border border-white/20 shadow-2xl animate-scaleIn">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-red-500/20">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-primary">Confirmer la suppression</h3>
            </div>
            <p className="text-secondary mb-4 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer le personnage <span className="font-semibold text-primary">"{characterToDelete.name}"</span> ?
            </p>
            <p className="text-secondary mb-6 text-sm">
              Cette action est irréversible.
            </p>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
              <p className="text-amber-300 text-sm flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span><strong>Attention :</strong> Seuls le propriétaire du personnage ou le MJ peuvent le supprimer.</span>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={confirmDeleteCharacter}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-red-500/50"
              >
                Supprimer
              </button>
              <button
                onClick={cancelDeleteCharacter}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 text-white rounded-xl font-semibold transition-all duration-300"
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
