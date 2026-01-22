import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { apiService } from '../services/api';

const CURRENCY_INFO = {
  crowns: { label: 'Couronnes', symbol: '👑', color: 'yellow' },
  orbs: { label: 'Orbes', symbol: '🔮', color: 'purple' },
  scepters: { label: 'Sceptres', symbol: '🏆', color: 'amber' },
  kings: { label: 'Rois', symbol: '♔', color: 'blue' }
};

export default function ItemTransferModal({ 
  isOpen, 
  onClose, 
  item, 
  fromCharacterId,
  gameId,
  characters = [],
  onTransferCreated,
  preselectedCharacterId = null,
  fromCharacterMoney = { crowns: 0, orbs: 0, scepters: 0, kings: 0 }
}) {
  const [selectedCharacterId, setSelectedCharacterId] = useState('');
  const [isExchange, setIsExchange] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Argent offert
  const [offeredMoney, setOfferedMoney] = useState({
    crowns: 0, orbs: 0, scepters: 0, kings: 0
  });
  
  // Argent demandé (pour les échanges)
  const [requestedMoney, setRequestedMoney] = useState({
    crowns: 0, orbs: 0, scepters: 0, kings: 0
  });

  // Filtrer les personnages pour exclure le personnage source
  const availableCharacters = characters.filter(c => c.id !== fromCharacterId);

  // Reset quand la modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setSelectedCharacterId(preselectedCharacterId || '');
      setIsExchange(false);
      setError(null);
      setOfferedMoney({ crowns: 0, orbs: 0, scepters: 0, kings: 0 });
      setRequestedMoney({ crowns: 0, orbs: 0, scepters: 0, kings: 0 });
    }
  }, [isOpen, preselectedCharacterId]);

  // Reset l'argent demandé quand on change de personnage
  useEffect(() => {
    setRequestedMoney({ crowns: 0, orbs: 0, scepters: 0, kings: 0 });
  }, [selectedCharacterId]);

  const handleMoneyChange = (type, currency, value) => {
    const numValue = Math.max(0, parseInt(value) || 0);
    if (type === 'offered') {
      // Limiter à ce que le joueur possède
      const maxValue = fromCharacterMoney[currency] || 0;
      setOfferedMoney(prev => ({ ...prev, [currency]: Math.min(numValue, maxValue) }));
    } else {
      // Pour l'argent demandé, pas de limite (vérification côté serveur à l'acceptation)
      setRequestedMoney(prev => ({ ...prev, [currency]: numValue }));
    }
  };

  const hasOfferedMoney = Object.values(offeredMoney).some(v => v > 0);
  const hasRequestedMoney = Object.values(requestedMoney).some(v => v > 0);
  const hasItem = item && item.text;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCharacterId) {
      setError('Veuillez sélectionner un personnage');
      return;
    }

    // Vérifier qu'il y a quelque chose à transférer
    if (!hasItem && !hasOfferedMoney) {
      setError('Veuillez sélectionner un item ou de l\'argent à transférer');
      return;
    }

    // Pour un échange, vérifier qu'on demande quelque chose en retour
    if (isExchange && !hasRequestedMoney) {
      setError('Veuillez indiquer l\'argent demandé en échange');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const transfer = await apiService.createItemTransfer({
        itemId: hasItem ? String(item.id) : null,
        itemText: hasItem ? item.text : null,
        fromCharacterId,
        toCharacterId: selectedCharacterId,
        gameId,
        isExchange,
        // Pas d'item demandé en échange - seulement de l'argent
        requestedItemId: null,
        requestedItemText: null,
        // Argent offert
        offeredCrowns: offeredMoney.crowns,
        offeredOrbs: offeredMoney.orbs,
        offeredScepters: offeredMoney.scepters,
        offeredKings: offeredMoney.kings,
        // Argent demandé (uniquement pour les échanges)
        requestedCrowns: isExchange ? requestedMoney.crowns : 0,
        requestedOrbs: isExchange ? requestedMoney.orbs : 0,
        requestedScepters: isExchange ? requestedMoney.scepters : 0,
        requestedKings: isExchange ? requestedMoney.kings : 0
      });

      if (window.notificationSystem) {
        const targetChar = characters.find(c => c.id === selectedCharacterId);
        const message = isExchange 
          ? `Demande d'échange envoyée à ${targetChar?.name || 'le joueur'}`
          : `Demande de transfert envoyée à ${targetChar?.name || 'le joueur'}`;
        window.notificationSystem.success(message);
      }

      onTransferCreated?.(transfer);
      onClose();
    } catch (err) {
      console.error('Erreur lors du transfert:', err);
      setError(err.message || 'Erreur lors du transfert');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Rendu avec un portail pour s'assurer que la modale est au-dessus de tout
  return createPortal(
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[10000] p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl w-full max-w-lg border border-white/20 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white">
            {isExchange ? 'Proposer un échange' : 'Transférer'}
          </h3>
        </div>

        {/* Item à transférer (si présent) */}
        {hasItem && (
          <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
            <p className="text-sm text-gray-400 mb-1">Votre item :</p>
            <p className="text-white font-semibold">{item.text}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Choix don ou échange */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-3 text-white">
              Type de transfert :
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsExchange(false)}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                  !isExchange 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg' 
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/20'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
                Don
              </button>
              <button
                type="button"
                onClick={() => setIsExchange(true)}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                  isExchange 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/20'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Échange
              </button>
            </div>
          </div>

          {/* Sélection du personnage cible */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2 text-white">
              {isExchange ? 'Échanger avec :' : 'Donner à :'}
            </label>
            {availableCharacters.length > 0 ? (
              <select
                value={selectedCharacterId}
                onChange={(e) => setSelectedCharacterId(e.target.value)}
                className="w-full p-3 border border-white/20 rounded-xl bg-white/5 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                disabled={loading}
              >
                <option value="">Sélectionner un personnage...</option>
                {availableCharacters.map(character => (
                  <option key={character.id} value={character.id}>
                    {character.name} ({character.playerName})
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-gray-400 text-sm p-3 bg-white/5 rounded-xl border border-white/10">
                Aucun autre personnage dans cette partie
              </p>
            )}
          </div>

          {/* Argent offert */}
          <div className="mb-4 p-4 bg-green-500/10 rounded-xl border border-green-500/30">
            <p className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {isExchange ? 'Argent que vous proposez :' : 'Argent à donner :'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(CURRENCY_INFO).map(([key, info]) => (
                <div key={key} className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
                  <span className="text-lg">{info.symbol}</span>
                  <input
                    type="number"
                    min="0"
                    max={fromCharacterMoney[key] || 0}
                    value={offeredMoney[key] || 0}
                    onChange={(e) => handleMoneyChange('offered', key, e.target.value)}
                    className="w-16 p-1 text-center border border-white/20 rounded bg-white/5 text-white text-sm"
                    disabled={loading}
                  />
                  <span className="text-xs text-gray-500">/ {fromCharacterMoney[key] || 0}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section échange - Argent demandé */}
          {isExchange && selectedCharacterId && (
            <>
              {/* Argent demandé */}
              <div className="mb-4 p-4 bg-amber-500/10 rounded-xl border border-amber-500/30">
                <p className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Argent demandé en échange :
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(CURRENCY_INFO).map(([key, info]) => (
                    <div key={key} className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
                      <span className="text-lg">{info.symbol}</span>
                      <input
                        type="number"
                        min="0"
                        value={requestedMoney[key] || 0}
                        onChange={(e) => handleMoneyChange('requested', key, e.target.value)}
                        className="w-20 p-1 text-center border border-white/20 rounded bg-white/5 text-white text-sm"
                        disabled={loading}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-amber-400/70 mt-2 italic">
                  Le joueur ne pourra accepter que s'il possède la somme demandée
                </p>
              </div>
            </>
          )}

          {/* Résumé */}
          {(hasItem || hasOfferedMoney || (isExchange && hasRequestedMoney)) && selectedCharacterId && (
            <div className="mb-4 p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
              <p className="text-sm text-blue-300 mb-2 font-semibold">Résumé :</p>
              <div className="text-sm space-y-1">
                <div className="text-green-400">
                  <span className="font-semibold">Vous proposez : </span>
                  {[
                    hasItem && item.text,
                    ...Object.entries(offeredMoney)
                      .filter(([_, v]) => v > 0)
                      .map(([k, v]) => `${v} ${CURRENCY_INFO[k].symbol}`)
                  ].filter(Boolean).join(', ') || 'Rien'}
                </div>
                {isExchange && hasRequestedMoney && (
                  <div className="text-amber-400">
                    <span className="font-semibold">En échange de : </span>
                    {Object.entries(requestedMoney)
                      .filter(([_, v]) => v > 0)
                      .map(([k, v]) => `${v} ${CURRENCY_INFO[k].symbol}`)
                      .join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || availableCharacters.length === 0}
              className={`flex-1 px-6 py-3 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                isExchange 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 hover:shadow-purple-500/50'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 hover:shadow-blue-500/50'
              }`}
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Envoi...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  {isExchange ? 'Proposer l\'échange' : 'Envoyer la demande'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 text-white rounded-xl font-semibold transition-all duration-300"
            >
              Annuler
            </button>
          </div>
        </form>

        <p className="mt-4 text-xs text-gray-500 text-center">
          {isExchange 
            ? 'Le joueur devra accepter l\'échange pour qu\'il soit effectué.'
            : 'Le joueur recevra une notification et devra accepter le transfert.'
          }
        </p>
      </div>
    </div>,
    document.body
  );
}
