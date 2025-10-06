import { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import CardList from './CardList';
import CardAssignment from './CardAssignment';
import CardViewer from './CardViewer';
import { apiService } from '../../services/api';

export default function CardManager({ gameId, characters }) {
  const { currentGame } = useGame();
  const { user } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showAssignment, setShowAssignment] = useState(false);

  // Charger les cartes de la partie
  const loadCards = async () => {
    if (!gameId) return;
    
    try {
      setLoading(true);
      const cardsData = await apiService.getCards(gameId);
      setCards(cardsData);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Erreur lors du chargement des cartes:', err);
    } finally {
      setLoading(false);
    }
  };


  // Ajouter une nouvelle carte à la partie
  const addCardToGame = async (cardData) => {
    try {
      setLoading(true);
      const newCard = await apiService.createCard(gameId, cardData);
      setCards(prev => [...prev, newCard]);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Erreur lors de l\'ajout de la carte:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Attribuer une carte à un personnage
  const assignCardToCharacter = async (cardId, characterId, notes = '') => {
    try {
      setLoading(true);
      await apiService.assignCardToCharacter(cardId, characterId, notes);
      await loadCards(); // Recharger pour avoir les données à jour
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Erreur lors de l\'attribution de la carte:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Retirer une carte d'un personnage
  const removeCardFromCharacter = async (cardId, characterId) => {
    try {
      setLoading(true);
      await apiService.removeCardFromCharacter(cardId, characterId);
      await loadCards();
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Erreur lors de la suppression de la carte:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, [gameId]);

  const isGM = user?.role === 'mj';

  return (
    <div className="card-manager bg-parchment text-ink p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-ink">Gestion des Cartes</h2>
        {isGM && (
          <button
            onClick={() => setShowAssignment(true)}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Attribuer une carte
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-4">
          <div className="text-amber-600">Chargement des cartes...</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Liste des cartes de la partie */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Cartes du monde</h3>
          <CardList
            cards={cards}
            onCardClick={setSelectedCard}
            onAddCard={isGM ? addCardToGame : null}
          />
        </div>

        {/* Cartes par personnage */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Cartes par personnage</h3>
          <div className="space-y-4">
            {characters.map(character => (
              <div key={character.id} className="border border-ink/20 rounded-lg p-4">
                <h4 className="font-semibold text-ink mb-2">{character.name}</h4>
                <div className="space-y-2">
                  {character.characterCards?.map(characterCard => (
                    <div key={characterCard.id} className="flex items-center justify-between bg-ink/5 p-2 rounded">
                      <span className="text-sm">{characterCard.card.name}</span>
                      {isGM && (
                        <button
                          onClick={() => removeCardFromCharacter(characterCard.card.id, character.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Retirer
                        </button>
                      )}
                    </div>
                  )) || (
                    <div className="text-sm text-ink/60">Aucune carte</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal d'attribution de carte */}
      {showAssignment && (
        <CardAssignment
          cards={cards}
          characters={characters}
          onAssign={assignCardToCharacter}
          onClose={() => setShowAssignment(false)}
        />
      )}

      {/* Modal de visualisation de carte */}
      {selectedCard && (
        <CardViewer
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </div>
  );
}
