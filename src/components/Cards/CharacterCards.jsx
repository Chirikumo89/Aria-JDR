import { useState } from 'react';
import CardViewer from './CardViewer';

export default function CharacterCards({ character, onRemoveCard, canEdit = false }) {
  const [selectedCard, setSelectedCard] = useState(null);

  if (!character.characterCards || character.characterCards.length === 0) {
    return (
      <div className="text-center py-4 text-ink/60">
        <div className="text-4xl mb-2">🃏</div>
        <p>Aucune carte en possession</p>
      </div>
    );
  }

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'Commune': return 'border-gray-400 bg-gray-50';
      case 'Peu commune': return 'border-green-400 bg-green-50';
      case 'Rare': return 'border-blue-400 bg-blue-50';
      case 'Très rare': return 'border-purple-400 bg-purple-50';
      case 'Légendaire': return 'border-amber-400 bg-amber-50';
      default: return 'border-gray-400 bg-gray-50';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Arme': return '⚔️';
      case 'Armure': return '🛡️';
      case 'Consommable': return '🧪';
      case 'Sort': return '✨';
      case 'Compétence': return '📚';
      case 'Objet': return '🎒';
      default: return '🃏';
    }
  };

  return (
    <div className="space-y-3">
      {character.characterCards.map(characterCard => (
        <div
          key={characterCard.id}
          className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${getRarityColor(characterCard.card.rarity)}`}
          onClick={() => setSelectedCard(characterCard.card)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getTypeIcon(characterCard.card.type)}</span>
              <div>
                <h4 className="font-semibold text-ink">{characterCard.card.name}</h4>
                <p className="text-sm text-ink/70">
                  {characterCard.card.type} • {characterCard.card.rarity}
                </p>
                {characterCard.notes && (
                  <p className="text-xs text-ink/60 mt-1 italic">
                    "{characterCard.notes}"
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right text-sm">
                <div className="text-ink/60">
                  {new Date(characterCard.acquiredAt).toLocaleDateString('fr-FR')}
                </div>
                {characterCard.card.cost > 0 && (
                  <div className="text-amber-600 font-medium">
                    {characterCard.card.cost} pièces
                  </div>
                )}
              </div>

              {canEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveCard(characterCard.card.id, character.id);
                  }}
                  className="text-red-600 hover:text-red-800 p-1"
                  title="Retirer cette carte"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

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
