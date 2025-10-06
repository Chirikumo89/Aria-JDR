import { useState, useEffect } from 'react';
import { cardScanner } from '../../services/cardScanner';

export default function CardList({ cards, onCardClick, onAddCard }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [availableCards, setAvailableCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);

  // Charger les cartes disponibles au montage du composant
  useEffect(() => {
    const loadAvailableCards = async () => {
      const cards = await cardScanner.scanCards();
      setAvailableCards(cards);
    };
    loadAvailableCards();
  }, []);

  const handleSelectFromAvailable = (availableCard) => {
    if (onAddCard) {
      onAddCard(availableCard);
      setShowAddForm(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Bouton pour ajouter une carte */}
      {onAddCard && (
        <div className="space-y-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            {showAddForm ? 'Annuler' : 'Ajouter une carte du monde'}
          </button>

          {/* Sélection des cartes disponibles */}
          {showAddForm && (
            <div className="border border-ink/20 rounded-lg p-4 bg-ink/5">
              <h4 className="font-semibold mb-3">Sélectionner une carte du monde</h4>
              
              {availableCards.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-ink/70 mb-3">
                    Cartes détectées dans le dossier /public/cartes/ :
                  </p>
                  <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                    {availableCards.map((card, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelectFromAvailable(card)}
                        className="text-left p-3 bg-ink/10 hover:bg-ink/20 rounded border border-ink/20 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🗺️</span>
                          <div>
                            <div className="font-semibold text-ink">{card.name}</div>
                            <div className="text-sm text-ink/70">{card.type}</div>
                            <div className="text-xs text-ink/60">{card.filename}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-ink/60">
                  <div className="text-4xl mb-2">📁</div>
                  <p>Aucune carte détectée</p>
                  <p className="text-sm mt-1">
                    Ajoutez des fichiers PDF dans le dossier /public/cartes/
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Liste des cartes */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {cards.length === 0 ? (
          <div className="text-center py-8 text-ink/60">
            Aucune carte dans cette partie
          </div>
        ) : (
          cards.map(card => (
            <div
              key={card.id}
              onClick={() => onCardClick(card)}
              className="p-3 border border-ink/20 rounded-lg hover:bg-ink/5 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-ink">{card.name}</h4>
                  <p className="text-sm text-ink/70">{card.type} • {card.rarity}</p>
                  {card.description && (
                    <p className="text-xs text-ink/60 mt-1 line-clamp-2">{card.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-amber-600">{card.cost} pièces</div>
                  <div className="text-xs text-ink/60">
                    {card.characterCards?.length || 0} attribution(s)
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
