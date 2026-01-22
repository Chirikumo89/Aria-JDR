import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useSocket } from '../context/SocketContext';

const CURRENCY_INFO = {
  crowns: { label: 'Couronnes', symbol: '👑' },
  orbs: { label: 'Orbes', symbol: '🔮' },
  scepters: { label: 'Sceptres', symbol: '🏆' },
  kings: { label: 'Rois', symbol: '♔' }
};

// Fonction utilitaire pour formater l'argent
const formatMoney = (transfer, prefix) => {
  const amounts = [];
  if (transfer[`${prefix}Crowns`] > 0) amounts.push(`${transfer[`${prefix}Crowns`]} 👑`);
  if (transfer[`${prefix}Orbs`] > 0) amounts.push(`${transfer[`${prefix}Orbs`]} 🔮`);
  if (transfer[`${prefix}Scepters`] > 0) amounts.push(`${transfer[`${prefix}Scepters`]} 🏆`);
  if (transfer[`${prefix}Kings`] > 0) amounts.push(`${transfer[`${prefix}Kings`]} ♔`);
  return amounts.join(', ');
};

// Fonction pour calculer le manque d'argent
const calculateMissingMoney = (transfer, characterMoney) => {
  if (!transfer.isExchange) return null;
  
  const missing = [];
  const currencies = ['crowns', 'orbs', 'scepters', 'kings'];
  const symbols = { crowns: '👑', orbs: '🔮', scepters: '🏆', kings: '♔' };
  
  for (const currency of currencies) {
    const requested = transfer[`requested${currency.charAt(0).toUpperCase() + currency.slice(1)}`] || 0;
    const available = characterMoney?.[currency] || 0;
    if (requested > available) {
      missing.push({
        currency,
        symbol: symbols[currency],
        amount: requested - available
      });
    }
  }
  
  return missing.length > 0 ? missing : null;
};

export default function PendingTransfers({ characterId, characterMoney = {}, onTransferHandled }) {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const socket = useSocket();

  // Charger les transferts en attente
  const loadTransfers = async () => {
    if (!characterId) return;
    
    try {
      const data = await apiService.getPendingTransfers(characterId);
      setTransfers(data);
    } catch (err) {
      console.error('Erreur lors du chargement des transferts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransfers();
  }, [characterId]);

  // Écouter les événements WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleTransferCreated = (data) => {
      if (data.transfer.toCharacterId === characterId) {
        setTransfers(prev => [data.transfer, ...prev]);
        if (window.notificationSystem) {
          let message = data.transfer.isExchange
            ? `${data.transfer.fromCharacter.name} vous propose un échange`
            : `${data.transfer.fromCharacter.name} veut vous transférer quelque chose`;
          window.notificationSystem.info(message);
        }
      }
    };

    const handleTransferCompleted = (data) => {
      setTransfers(prev => prev.filter(t => t.id !== data.transferId));
    };

    const handleTransferDeleted = (data) => {
      setTransfers(prev => prev.filter(t => t.id !== data.transferId));
    };

    socket.on('itemTransferCreated', handleTransferCreated);
    socket.on('itemTransferCompleted', handleTransferCompleted);
    socket.on('itemTransferDeleted', handleTransferDeleted);

    return () => {
      socket.off('itemTransferCreated', handleTransferCreated);
      socket.off('itemTransferCompleted', handleTransferCompleted);
      socket.off('itemTransferDeleted', handleTransferDeleted);
    };
  }, [socket, characterId]);

  const handleAccept = async (transferId) => {
    setProcessingId(transferId);
    try {
      const result = await apiService.respondToTransfer(transferId, 'accepted');
      setTransfers(prev => prev.filter(t => t.id !== transferId));
      if (window.notificationSystem) {
        const transfer = transfers.find(t => t.id === transferId);
        const message = transfer?.isExchange 
          ? 'Échange effectué avec succès !'
          : 'Transfert reçu avec succès !';
        window.notificationSystem.success(message);
      }
      onTransferHandled?.();
    } catch (err) {
      console.error('Erreur:', err);
      if (window.notificationSystem) {
        window.notificationSystem.error(err.message || 'Erreur lors de l\'acceptation');
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (transferId) => {
    setProcessingId(transferId);
    try {
      await apiService.respondToTransfer(transferId, 'rejected');
      setTransfers(prev => prev.filter(t => t.id !== transferId));
      if (window.notificationSystem) {
        const transfer = transfers.find(t => t.id === transferId);
        const message = transfer?.isExchange 
          ? 'Échange refusé'
          : 'Transfert refusé';
        window.notificationSystem.info(message);
      }
    } catch (err) {
      console.error('Erreur:', err);
      if (window.notificationSystem) {
        window.notificationSystem.error(err.message || 'Erreur lors du refus');
      }
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return null;
  }

  if (transfers.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 border-2 border-blue-300 shadow-md">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-900">
        <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        Propositions en attente ({transfers.length})
      </h3>
      
      <div className="space-y-3">
        {transfers.map(transfer => {
          const hasOfferedItem = transfer.itemText;
          const hasOfferedMoney = formatMoney(transfer, 'offered');
          const hasRequestedMoney = formatMoney(transfer, 'requested');
          
          // Calculer le manque d'argent
          const missingMoney = calculateMissingMoney(transfer, characterMoney);
          const cannotAfford = missingMoney !== null;
          
          return (
            <div 
              key={transfer.id} 
              className={`p-4 bg-white/80 rounded-xl border shadow-sm ${
                transfer.isExchange 
                  ? 'border-purple-200/50' 
                  : 'border-blue-200/50'
              }`}
            >
              {/* Badge type et expéditeur */}
              <div className="flex items-center gap-2 mb-3">
                {transfer.isExchange ? (
                  <span className="px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-700 rounded-full flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Échange
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                    Don
                  </span>
                )}
                <span className="text-xs text-ink/50">
                  de {transfer.fromCharacter?.name} ({transfer.fromCharacter?.playerName})
                </span>
              </div>

              {/* Détails du transfert/échange */}
              <div className="mb-3 space-y-2">
                {/* Ce que vous recevez */}
                <div className="p-2 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-green-700 font-semibold mb-1">Vous recevez :</p>
                  <div className="space-y-1">
                    {hasOfferedItem && (
                      <p className="text-sm text-green-800 font-medium flex items-center gap-1">
                        <span className="text-green-600">📦</span> {transfer.itemText}
                      </p>
                    )}
                    {hasOfferedMoney && (
                      <p className="text-sm text-green-800 font-medium flex items-center gap-1">
                        <span className="text-green-600">💰</span> {hasOfferedMoney}
                      </p>
                    )}
                    {!hasOfferedItem && !hasOfferedMoney && (
                      <p className="text-sm text-green-600 italic">Rien</p>
                    )}
                  </div>
                </div>
                
                {/* Ce que vous donnez en échange (argent demandé) */}
                {transfer.isExchange && hasRequestedMoney && (
                  <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-xs text-amber-700 font-semibold mb-1">En échange de :</p>
                    <div className="space-y-1">
                      <p className="text-sm text-amber-800 font-medium flex items-center gap-1">
                        <span className="text-amber-600">💰</span> {hasRequestedMoney}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Message d'erreur si fonds insuffisants */}
                {cannotAfford && (
                  <div className="p-2 bg-red-50 rounded-lg border border-red-300">
                    <p className="text-xs text-red-700 font-semibold flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Fonds insuffisants !
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      Il vous manque : {missingMoney.map(m => `${m.amount} ${m.symbol}`).join(', ')}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleAccept(transfer.id)}
                  disabled={processingId === transfer.id || cannotAfford}
                  className={`flex-1 px-4 py-2 text-white text-sm rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 ${
                    cannotAfford
                      ? 'bg-gray-400 cursor-not-allowed'
                      : transfer.isExchange
                        ? 'bg-purple-600 hover:bg-purple-500'
                        : 'bg-green-600 hover:bg-green-500'
                  }`}
                  title={cannotAfford ? 'Vous n\'avez pas assez d\'argent pour cet échange' : ''}
                >
                  {processingId === transfer.id ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {cannotAfford ? 'Fonds insuffisants' : (transfer.isExchange ? 'Accepter l\'échange' : 'Accepter')}
                </button>
                <button
                  onClick={() => handleReject(transfer.id)}
                  disabled={processingId === transfer.id}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-600 text-sm rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Refuser
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
