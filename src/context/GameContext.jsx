import { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';

const GameContext = createContext(null);
export const useGame = () => useContext(GameContext);

export function GameProvider({ children }) {
  const [games, setGames] = useState([]);
  const [currentGame, setCurrentGame] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [diceRolls, setDiceRolls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Charger les parties
  const loadGames = async () => {
    try {
      setLoading(true);
      const gamesData = await apiService.getGames();
      setGames(gamesData);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Erreur lors du chargement des parties:', err);
    } finally {
      setLoading(false);
    }
  };

  // Créer une nouvelle partie
  const createGame = async (gameData) => {
    try {
      setLoading(true);
      const newGame = await apiService.createGame(gameData);
      setGames(prev => [...prev, newGame]);
      setError(null);
      return newGame;
    } catch (err) {
      setError(err.message);
      console.error('Erreur lors de la création de la partie:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Supprimer une partie
  const deleteGame = async (gameId, userId) => {
    try {
      console.log('deleteGame called with gameId:', gameId, 'userId:', userId);
      setLoading(true);
      await apiService.deleteGame(gameId, userId);
      console.log('API call successful, updating state');
      setGames(prev => prev.filter(game => game.id !== gameId));
      
      // Si la partie supprimée était sélectionnée, la désélectionner
      if (currentGame && currentGame.id === gameId) {
        console.log('Deselecting current game');
        setCurrentGame(null);
        setCharacters([]);
        setDiceRolls([]);
      }
      
      setError(null);
      console.log('Game deleted successfully');
    } catch (err) {
      setError(err.message);
      console.error('Erreur lors de la suppression de la partie:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Charger les personnages d'une partie
  const loadCharacters = async (gameId) => {
    try {
      setLoading(true);
      const charactersData = await apiService.getCharacters(gameId);
      setCharacters(charactersData);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Erreur lors du chargement des personnages:', err);
    } finally {
      setLoading(false);
    }
  };

  // Créer un personnage
  const createCharacter = async (characterData) => {
    if (!currentGame) throw new Error('Aucune partie sélectionnée');
    
    try {
      setLoading(true);
      const newCharacter = await apiService.createCharacter(currentGame.id, characterData);
      setCharacters(prev => [...prev, newCharacter]);
      setError(null);
      return newCharacter;
    } catch (err) {
      setError(err.message);
      console.error('Erreur lors de la création du personnage:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour un personnage
  const updateCharacter = async (characterId, characterData) => {
    try {
      setLoading(true);
      const updatedCharacter = await apiService.updateCharacter(characterId, characterData);
      setCharacters(prev => prev.map(c => c.id === characterId ? updatedCharacter : c));
      setError(null);
      return updatedCharacter;
    } catch (err) {
      setError(err.message);
      console.error('Erreur lors de la mise à jour du personnage:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un personnage
  const deleteCharacter = async (characterId) => {
    try {
      setLoading(true);
      await apiService.deleteCharacter(characterId);
      setCharacters(prev => prev.filter(c => c.id !== characterId));
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Erreur lors de la suppression du personnage:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Charger les lancers de dés d'une partie
  const loadDiceRolls = async (gameId, limit = 50) => {
    try {
      setLoading(true);
      const diceRollsData = await apiService.getDiceRolls(gameId, limit);
      setDiceRolls(diceRollsData);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Erreur lors du chargement des lancers de dés:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sélectionner une partie
  const selectGame = async (game) => {
    setCurrentGame(game);
    if (game) {
      await loadCharacters(game.id);
      await loadDiceRolls(game.id);
    } else {
      setCharacters([]);
      setDiceRolls([]);
    }
  };

  // Ajouter un lancer de dés (appelé depuis Socket.IO)
  const addDiceRoll = (diceRoll) => {
    setDiceRolls(prev => [diceRoll, ...prev]);
  };

  // Charger les données au montage
  useEffect(() => {
    loadGames();
  }, []);

  const value = {
    games,
    currentGame,
    characters,
    diceRolls,
    loading,
    error,
    loadGames,
    createGame,
    deleteGame,
    loadCharacters,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    loadDiceRolls,
    selectGame,
    addDiceRoll
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}
