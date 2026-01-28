import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Configuration de PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export default function CardViewer({ card, onClose }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!card) return null;

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'Commune': return 'text-gray-600';
      case 'Peu commune': return 'text-green-600';
      case 'Rare': return 'text-blue-600';
      case 'Très rare': return 'text-purple-600';
      case 'Légendaire': return 'text-amber-600';
      default: return 'text-gray-600';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Carte du monde': return '🗺️';
      case 'Lieu': return '🏰';
      case 'Région': return '🌍';
      case 'Ville': return '🏘️';
      case 'Dungeon': return '🏰';
      case 'Carte': return '🗺️';
      default: return '🗺️';
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error) => {
    console.error('Erreur lors du chargement du PDF:', error);
    setError('Erreur lors du chargement du PDF');
    setLoading(false);
  };

  const changePage = (offset) => {
    setPageNumber(prevPageNumber => {
      const newPageNumber = prevPageNumber + offset;
      return Math.max(1, Math.min(newPageNumber, numPages));
    });
  };

  const changeScale = (newScale) => {
    setScale(Math.max(0.5, Math.min(3.0, newScale)));
  };

  const isPDF = card.image && card.image.toLowerCase().endsWith('.pdf');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`bg-parchment text-ink rounded-lg shadow-xl mx-4 ${
        isPDF ? 'max-w-6xl w-full h-[90vh]' : 'max-w-lg w-full'
      }`}>
        <div className="flex justify-between items-center p-6 border-b border-ink/20">
          <h3 className="text-xl font-bold">Détails de la carte</h3>
          <button
            onClick={onClose}
            className="text-ink/60 hover:text-ink text-2xl"
          >
            ×
          </button>
        </div>

        <div className={`${isPDF ? 'flex flex-col h-full' : 'p-6 space-y-4'}`}>
          {isPDF ? (
            // Affichage PDF
            <div className="flex-1 flex flex-col">
              {/* Informations de la carte */}
              <div className="p-4 bg-ink/5 border-b border-ink/20">
                <div className="text-center">
                  <h4 className="text-2xl font-bold text-ink mb-2">{card.name}</h4>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-2xl">{getTypeIcon(card.type)}</span>
                    <span className="text-lg font-semibold">{card.type}</span>
                    <span className={`text-lg font-semibold ${getRarityColor(card.rarity)}`}>
                      {card.rarity}
                    </span>
                  </div>
                  {card.description && (
                    <p className="text-ink/80 text-sm">{card.description}</p>
                  )}
                </div>
              </div>

              {/* Contrôles PDF */}
              <div className="p-4 bg-ink/5 border-b border-ink/20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => changePage(-1)}
                    disabled={pageNumber <= 1}
                    className="px-3 py-1 bg-amber-600 text-white rounded disabled:bg-gray-400 hover:bg-amber-700"
                  >
                    ← Précédent
                  </button>
                  <span className="text-sm">
                    Page {pageNumber} sur {numPages || '...'}
                  </span>
                  <button
                    onClick={() => changePage(1)}
                    disabled={pageNumber >= numPages}
                    className="px-3 py-1 bg-amber-600 text-white rounded disabled:bg-gray-400 hover:bg-amber-700"
                  >
                    Suivant →
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => changeScale(scale - 0.25)}
                    className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    -
                  </button>
                  <span className="text-sm min-w-[60px] text-center">
                    {Math.round(scale * 100)}%
                  </span>
                  <button
                    onClick={() => changeScale(scale + 0.25)}
                    className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Visionneuse PDF */}
              <div className="flex-1 overflow-auto p-4 bg-white">
                {loading && (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-amber-600">Chargement du PDF...</div>
                  </div>
                )}
                
                {error && (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-red-600 text-center">
                      <div className="text-2xl mb-2">❌</div>
                      <div>{error}</div>
                    </div>
                  </div>
                )}

                {!loading && !error && (
                  <div className="flex justify-center">
                    <Document
                      file={card.image}
                      onLoadSuccess={onDocumentLoadSuccess}
                      onLoadError={onDocumentLoadError}
                      loading={
                        <div className="flex items-center justify-center h-64">
                          <div className="text-amber-600">Chargement du PDF...</div>
                        </div>
                      }
                    >
                      <Page
                        pageNumber={pageNumber}
                        scale={scale}
                        className="shadow-lg"
                      />
                    </Document>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Affichage normal (image)
            <>
              {/* Image de la carte */}
              {card.image && (
                <div className="text-center">
                  <img
                    src={card.image}
                    alt={card.name}
                    className="max-w-full h-48 object-contain mx-auto rounded border border-ink/20"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Informations principales */}
              <div className="text-center">
                <h4 className="text-2xl font-bold text-ink mb-2">{card.name}</h4>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-2xl">{getTypeIcon(card.type)}</span>
                  <span className="text-lg font-semibold">{card.type}</span>
                  <span className={`text-lg font-semibold ${getRarityColor(card.rarity)}`}>
                    {card.rarity}
                  </span>
                </div>
                {card.cost > 0 && (
                  <div className="text-amber-600 font-semibold">
                    Coût : {card.cost} pièces
                  </div>
                )}
              </div>

              {/* Description */}
              {card.description && (
                <div className="bg-ink/5 p-4 rounded border border-ink/20">
                  <h5 className="font-semibold mb-2">Description :</h5>
                  <p className="text-ink/80 leading-relaxed">{card.description}</p>
                </div>
              )}

              {/* Statistiques d'attribution */}
              <div className="bg-ink/5 p-4 rounded border border-ink/20">
                <h5 className="font-semibold mb-2">Statistiques :</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-ink/70">Attributions :</span>
                    <span className="ml-2 font-semibold">{card.characterCards?.length || 0}</span>
                  </div>
                  <div>
                    <span className="text-ink/70">Créée le :</span>
                    <span className="ml-2 font-semibold">
                      {new Date(card.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Liste des personnages ayant cette carte */}
              {card.characterCards && card.characterCards.length > 0 && (
                <div className="bg-ink/5 p-4 rounded border border-ink/20">
                  <h5 className="font-semibold mb-2">Possédée par :</h5>
                  <div className="space-y-1">
                    {card.characterCards.map(characterCard => (
                      <div key={characterCard.id} className="flex justify-between items-center text-sm">
                        <span>{characterCard.character.name}</span>
                        <span className="text-ink/60">
                          {new Date(characterCard.acquiredAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bouton de fermeture */}
        <div className="p-6 border-t border-ink/20 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
