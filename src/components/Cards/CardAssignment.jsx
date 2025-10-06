import { useState } from 'react';

export default function CardAssignment({ cards, characters, onAssign, onClose }) {
  const [selectedCard, setSelectedCard] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedCard || !selectedCharacter) return;

    try {
      setLoading(true);
      await onAssign(selectedCard, selectedCharacter, notes);
      setSelectedCard('');
      setSelectedCharacter('');
      setNotes('');
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'attribution:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedCardData = cards.find(card => card.id === selectedCard);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-parchment text-ink p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Attribuer une carte</h3>
          <button
            onClick={onClose}
            className="text-ink/60 hover:text-ink text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleAssign} className="space-y-4">
          {/* Sélection de la carte */}
          <div>
            <label className="block text-sm font-medium mb-2">Carte à attribuer :</label>
            <select
              value={selectedCard}
              onChange={(e) => setSelectedCard(e.target.value)}
              className="w-full p-3 border border-ink/30 rounded bg-transparent text-ink"
              required
            >
              <option value="">Sélectionner une carte...</option>
              {cards.map(card => (
                <option key={card.id} value={card.id}>
                  {card.name} ({card.type} - {card.rarity})
                </option>
              ))}
            </select>
          </div>

          {/* Aperçu de la carte sélectionnée */}
          {selectedCardData && (
            <div className="p-3 bg-ink/5 rounded border border-ink/20">
              <h4 className="font-semibold">{selectedCardData.name}</h4>
              <p className="text-sm text-ink/70">{selectedCardData.type} • {selectedCardData.rarity}</p>
              {selectedCardData.description && (
                <p className="text-xs text-ink/60 mt-1">{selectedCardData.description}</p>
              )}
              <p className="text-sm text-amber-600 mt-1">Coût : {selectedCardData.cost} pièces</p>
            </div>
          )}

          {/* Sélection du personnage */}
          <div>
            <label className="block text-sm font-medium mb-2">Attribuer à :</label>
            <select
              value={selectedCharacter}
              onChange={(e) => setSelectedCharacter(e.target.value)}
              className="w-full p-3 border border-ink/30 rounded bg-transparent text-ink"
              required
            >
              <option value="">Sélectionner un personnage...</option>
              {characters.map(character => (
                <option key={character.id} value={character.id}>
                  {character.name} ({character.function || 'Aventurier'})
                </option>
              ))}
            </select>
          </div>

          {/* Notes d'acquisition */}
          <div>
            <label className="block text-sm font-medium mb-2">Notes d'acquisition (optionnel) :</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 border border-ink/30 rounded bg-transparent text-ink"
              rows="3"
              placeholder="Comment le personnage a obtenu cette carte..."
            />
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !selectedCard || !selectedCharacter}
              className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? 'Attribution...' : 'Attribuer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
