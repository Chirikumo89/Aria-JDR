import { useState, useEffect, useCallback } from 'react';
import {
  CURRENCY_TYPES,
  CURRENCY_NAMES,
  CURRENCY_SYMBOLS,
  CURRENCY_ALTERNATIVE_NAMES,
  formatCurrencies,
  getTotalInKings,
  optimizeCurrencies,
  convertCurrency,
  canAfford,
  performTransaction
} from '../utils/currency';
import apiService from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import CurrencyHelp from './CurrencyHelp';

export default function CommonTreasury({ gameId, disabled = false }) {
  const socket = useSocket();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [currencies, setCurrencies] = useState({
    crowns: 0,
    orbs: 0,
    scepters: 0,
    kings: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConverter, setShowConverter] = useState(false);
  const [conversionAmount, setConversionAmount] = useState('');
  const [conversionFrom, setConversionFrom] = useState(CURRENCY_TYPES.KINGS);
  const [conversionTo, setConversionTo] = useState(CURRENCY_TYPES.CROWNS);

  // États pour les transactions
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentCurrency, setPaymentCurrency] = useState(CURRENCY_TYPES.KINGS);
  const [paymentDescription, setPaymentDescription] = useState('');
  const [showTransactions, setShowTransactions] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // États pour les revenus (transactions positives)
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeCurrency, setIncomeCurrency] = useState(CURRENCY_TYPES.KINGS);
  const [incomeDescription, setIncomeDescription] = useState('');

  // Définir les fonctions de chargement AVANT les useEffect
  const loadCommonTreasury = useCallback(async () => {
    if (!gameId) return;
    try {
      setLoading(true);
      const treasury = await apiService.getCommonTreasury(gameId);
      setCurrencies({
        crowns: treasury.commonTreasuryCrowns || 0,
        orbs: treasury.commonTreasuryOrbs || 0,
        scepters: treasury.commonTreasuryScepters || 0,
        kings: treasury.commonTreasuryKings || 0
      });
    } catch (error) {
      console.error('Erreur lors du chargement de la caisse commune:', error);
      // En cas d'erreur, initialiser avec des valeurs par défaut
      setCurrencies({
        crowns: 0,
        orbs: 0,
        scepters: 0,
        kings: 0
      });
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  const loadTransactions = useCallback(async () => {
    if (!gameId) return;

    try {
      setLoadingTransactions(true);
      const transactions = await apiService.getCommonTreasuryTransactions(gameId);
      setTransactionHistory(transactions);
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  }, [gameId]);

  // Charger la caisse commune depuis la base de données
  useEffect(() => {
    if (gameId) {
      loadCommonTreasury();
    } else {
      setLoading(false);
    }
  }, [gameId, loadCommonTreasury]);

  // Charger les transactions depuis la base de données
  useEffect(() => {
    if (gameId && showTransactions) {
      loadTransactions();
    }
  }, [gameId, showTransactions, loadTransactions]);

  // Écouter les mises à jour en temps réel via WebSocket
  useEffect(() => {
    if (!socket || !gameId) return;

    const handleTreasuryUpdate = (data) => {
      // Vérifier que la mise à jour concerne cette partie
      if (data.gameId === gameId && data.treasury) {
        console.log('[CommonTreasury] Mise à jour reçue via WebSocket:', data.treasury);
        setCurrencies({
          crowns: data.treasury.commonTreasuryCrowns || 0,
          orbs: data.treasury.commonTreasuryOrbs || 0,
          scepters: data.treasury.commonTreasuryScepters || 0,
          kings: data.treasury.commonTreasuryKings || 0
        });
      }
    };

    socket.on('commonTreasuryUpdated', handleTreasuryUpdate);

    return () => {
      socket.off('commonTreasuryUpdated', handleTreasuryUpdate);
    };
  }, [socket, gameId]);

  // Sauvegarder la caisse commune dans la base de données
  const saveCommonTreasury = async (newCurrencies) => {
    if (!gameId) return;

    try {
      setSaving(true);
      const optimized = optimizeCurrencies(newCurrencies);
      await apiService.updateCommonTreasury(gameId, {
        commonTreasuryCrowns: optimized.crowns || 0,
        commonTreasuryOrbs: optimized.orbs || 0,
        commonTreasuryScepters: optimized.scepters || 0,
        commonTreasuryKings: optimized.kings || 0
      });
      setCurrencies(optimized);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la caisse commune:', error);
      const errorMessage = error.message || 'Erreur lors de la sauvegarde de la caisse commune';
      alert(`Erreur lors de la sauvegarde de la caisse commune: ${errorMessage}`);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleCurrencyChange = (currencyType, value) => {
    const newCurrencies = { ...currencies };
    newCurrencies[currencyType] = Math.max(0, parseInt(value) || 0);

    // Mettre à jour l'état immédiatement pour l'affichage
    setCurrencies(newCurrencies);
  };

  // Sauvegarder lors de la perte de focus (onBlur)
  const handleCurrencyBlur = async () => {
    // Utiliser une fonction de callback pour obtenir les valeurs les plus récentes
    setCurrencies(currentCurrencies => {
      // Optimiser automatiquement les monnaies avant sauvegarde
      const optimized = optimizeCurrencies(currentCurrencies);

      // Sauvegarder de manière asynchrone sans bloquer
      setTimeout(() => {
        saveCommonTreasury(optimized).catch(error => {
          console.error('Erreur lors de la sauvegarde:', error);
        });
      }, 0);

      return optimized;
    });
  };

  const handleOptimize = async () => {
    const optimized = optimizeCurrencies(currencies);
    setCurrencies(optimized);
    await saveCommonTreasury(optimized);
  };

  // Fonction pour effectuer un paiement sur la caisse commune
  const handlePayment = async () => {
    const amount = parseInt(paymentAmount) || 0;
    if (amount <= 0) return;

    // Vérifier que la description est renseignée
    if (!paymentDescription.trim()) {
      alert('Veuillez saisir une description pour la transaction !');
      return;
    }

    const paymentCost = { [paymentCurrency]: amount };

    if (!canAfford(currencies, paymentCost)) {
      alert('Fonds insuffisants dans la caisse commune pour ce paiement !');
      return;
    }

    try {
      const newCurrencies = performTransaction(currencies, paymentCost);
      setCurrencies(newCurrencies);
      await saveCommonTreasury(newCurrencies);

      // Sauvegarder la transaction en base de données
      if (gameId && user?.username) {
        const transactionData = {
          type: 'payment',
          amount: amount,
          currency: paymentCurrency,
          description: paymentDescription.trim(),
          username: user.username
        };

        await apiService.createCommonTreasuryTransaction(gameId, transactionData);

        // Ne pas ajouter à l'historique local ici car le serveur émet un événement WebSocket
        // qui sera reçu par tous les clients (y compris celui-ci) et ajoutera la transaction
      }

      // Reset du formulaire de paiement
      setPaymentAmount('');
      setPaymentDescription('');

    } catch (error) {
      console.error('Erreur lors du paiement:', error);
      alert(error.message || 'Erreur lors du paiement');
    }
  };

  // Fonction pour recevoir un revenu dans la caisse commune (transaction positive)
  const handleIncome = async () => {
    const amount = parseInt(incomeAmount) || 0;
    if (amount <= 0) return;

    // Vérifier que la description est renseignée
    if (!incomeDescription.trim()) {
      alert('Veuillez saisir une description pour la transaction !');
      return;
    }

    try {
      // Ajouter l'argent aux monnaies existantes
      const newCurrencies = { ...currencies };
      newCurrencies[incomeCurrency] = (newCurrencies[incomeCurrency] || 0) + amount;

      // Optimiser et sauvegarder
      const optimized = optimizeCurrencies(newCurrencies);
      setCurrencies(optimized);
      await saveCommonTreasury(optimized);

      // Sauvegarder la transaction en base de données
      if (gameId && user?.username) {
        const transactionData = {
          type: 'income',
          amount: amount,
          currency: incomeCurrency,
          description: incomeDescription.trim(),
          username: user.username
        };

        await apiService.createCommonTreasuryTransaction(gameId, transactionData);

        // Ne pas ajouter à l'historique local ici car le serveur émet un événement WebSocket
        // qui sera reçu par tous les clients (y compris celui-ci) et ajoutera la transaction
      }

      // Reset du formulaire de revenu
      setIncomeAmount('');
      setIncomeDescription('');

    } catch (error) {
      console.error('Erreur lors de l\'ajout du revenu:', error);
      alert(error.message || 'Erreur lors de l\'ajout du revenu');
    }
  };

  const handleConversion = async () => {
    const amount = parseInt(conversionAmount) || 0;
    if (amount <= 0) return;

    const convertedAmount = convertCurrency(amount, conversionFrom, conversionTo);
    const newCurrencies = { ...currencies };

    // Soustraire de la monnaie source
    newCurrencies[conversionFrom] = Math.max(0, (newCurrencies[conversionFrom] || 0) - amount);

    // Ajouter à la monnaie cible
    newCurrencies[conversionTo] = (newCurrencies[conversionTo] || 0) + convertedAmount;

    const optimized = optimizeCurrencies(newCurrencies);
    setCurrencies(optimized);
    await saveCommonTreasury(optimized);

    // Reset du convertisseur
    setConversionAmount('');
  };

  // Écouter les transactions de caisse commune via WebSocket
  useEffect(() => {
    if (!socket || !gameId) return;

    const handleTreasuryTransaction = (data) => {
      // Vérifier que la transaction concerne cette partie
      if (data.gameId === gameId && data.transaction) {
        console.log('[CommonTreasury] Transaction reçue via WebSocket:', data.transaction);

        // Ajouter à l'historique local
        setTransactionHistory(prev => [data.transaction, ...prev]);

        // Afficher une notification pour tous les joueurs
        if (showNotification) {
          const isIncome = data.transaction.type === 'income';
          const actionText = isIncome ? 'a ajouté' : 'a effectué un paiement de';
          const preposition = isIncome ? 'à' : 'depuis';

          showNotification({
            type: 'treasury',
            message: `${data.username} ${actionText} ${data.transaction.amount} ${CURRENCY_SYMBOLS[data.transaction.currency]} ${CURRENCY_NAMES[data.transaction.currency]} ${preposition} la caisse commune`,
            username: data.username,
            amount: data.transaction.amount,
            currency: data.transaction.currency,
            transactionType: data.transaction.type
          });
        }

        // Recharger la caisse commune pour avoir les valeurs à jour
        loadCommonTreasury();
      }
    };

    socket.on('commonTreasuryTransaction', handleTreasuryTransaction);

    return () => {
      socket.off('commonTreasuryTransaction', handleTreasuryTransaction);
    };
  }, [socket, gameId, showNotification, loadCommonTreasury]);

  const totalInKings = getTotalInKings(currencies);

  if (!gameId) {
    return null; // Ne rien afficher si pas de gameId
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-ink/70 italic">Chargement de la caisse commune...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête avec total */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-ink">🏛️ CAISSE COMMUNE</h3>
          <CurrencyHelp />
        </div>
        <div className="text-sm text-ink/70">
          Total: {totalInKings} rois
        </div>
      </div>

      {/* Affichage des monnaies (lecture seule) */}
      <div className="grid grid-cols-2 gap-4">
        {Object.keys(CURRENCY_TYPES).map(key => {
          const currency = CURRENCY_TYPES[key];
          const amount = currencies[currency] || 0;
          const symbol = CURRENCY_SYMBOLS[currency];
          const name = CURRENCY_NAMES[currency];

          return (
            <div key={currency} className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-ink">
                <span className="text-lg">{symbol}</span>
                <span>{name}</span>
                <span className="text-xs text-ink/60">
                  ({CURRENCY_ALTERNATIVE_NAMES[currency].join(', ')})
                </span>
              </label>
              <div className="w-full p-2 border-2 border-ink/30 bg-parchment/30 text-ink text-center rounded font-bold">
                {amount}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-ink/60 italic text-center">
        Utilisez les transactions ci-dessous pour modifier la caisse commune
      </p>

      {/* Boutons d'action */}
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setShowConverter(!showConverter)}
          disabled={disabled || saving}
          className="px-3 py-1 bg-ink text-parchment rounded text-sm hover:bg-ink/80 disabled:opacity-50"
        >
          🔀 Convertir
        </button>
        <button
          type="button"
          onClick={() => setShowTransactions(!showTransactions)}
          disabled={disabled || saving}
          className={`px-3 py-1 rounded text-sm transition-colors ${showTransactions ? 'bg-amber-600 text-white' : 'bg-ink text-parchment hover:bg-ink/80'} disabled:opacity-50`}
        >
          💳 Transactions
        </button>
        {saving && (
          <span className="px-3 py-1 text-sm text-ink/70 italic">
            💾 Sauvegarde...
          </span>
        )}
      </div>

      {/* Convertisseur de monnaies */}
      {showConverter && (
        <div className="p-4 border-2 border-ink rounded bg-parchment/50">
          <h4 className="text-md font-bold text-ink mb-3">Convertisseur de monnaies</h4>

          <div className="grid grid-cols-3 gap-2 items-end">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Quantité</label>
              <input
                type="number"
                min="1"
                value={conversionAmount}
                onChange={(e) => setConversionAmount(e.target.value)}
                className="w-full p-2 border-2 border-ink bg-transparent text-ink text-center rounded"
                placeholder="0"
                disabled={disabled || saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">De</label>
              <select
                value={conversionFrom}
                onChange={(e) => setConversionFrom(e.target.value)}
                className="w-full p-2 border-2 border-ink bg-parchment text-ink rounded"
                disabled={disabled || saving}
              >
                {Object.keys(CURRENCY_TYPES).map(key => {
                  const currency = CURRENCY_TYPES[key];
                  const symbol = CURRENCY_SYMBOLS[currency];
                  const name = CURRENCY_NAMES[currency];
                  return (
                    <option key={currency} value={currency}>
                      {symbol} {name}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">Vers</label>
              <select
                value={conversionTo}
                onChange={(e) => setConversionTo(e.target.value)}
                className="w-full p-2 border-2 border-ink bg-parchment text-ink rounded"
                disabled={disabled || saving}
              >
                {Object.keys(CURRENCY_TYPES).map(key => {
                  const currency = CURRENCY_TYPES[key];
                  const symbol = CURRENCY_SYMBOLS[currency];
                  const name = CURRENCY_NAMES[currency];
                  return (
                    <option key={currency} value={currency}>
                      {symbol} {name}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="mt-3 flex justify-between items-center">
            <div className="text-sm text-ink/70">
              {conversionAmount && conversionFrom !== conversionTo ? (
                <>
                  {conversionAmount} {CURRENCY_SYMBOLS[conversionFrom]} = {' '}
                  {convertCurrency(parseInt(conversionAmount) || 0, conversionFrom, conversionTo)} {CURRENCY_SYMBOLS[conversionTo]}
                </>
              ) : (
                'Sélectionnez une quantité et des monnaies différentes'
              )}
            </div>

            <button
              type="button"
              onClick={handleConversion}
              disabled={disabled || saving || !conversionAmount || conversionFrom === conversionTo || (currencies[conversionFrom] || 0) < (parseInt(conversionAmount) || 0)}
              className="px-4 py-2 bg-ink text-parchment rounded hover:bg-ink/80 disabled:opacity-50"
            >
              Convertir
            </button>
          </div>
        </div>
      )}

      {/* Interface des transactions */}
      {showTransactions && (
        <div className="p-4 border-2 border-ink rounded bg-parchment/50">
          <h4 className="text-md font-bold text-ink mb-3">💳 Transactions de la caisse commune</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Formulaire de paiement (dépense) */}
            <div className="p-3 border border-red-300 rounded bg-red-50/30">
              <h5 className="text-sm font-bold text-red-700 mb-2">💸 Effectuer un paiement</h5>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-ink mb-1">Montant</label>
                    <input
                      type="number"
                      min="1"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full p-2 border-2 border-ink bg-transparent text-ink text-center rounded text-sm"
                      placeholder="0"
                      disabled={disabled || saving}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-ink mb-1">Monnaie</label>
                    <select
                      value={paymentCurrency}
                      onChange={(e) => setPaymentCurrency(e.target.value)}
                      className="w-full p-2 border-2 border-ink bg-parchment text-ink rounded text-sm"
                      disabled={disabled || saving}
                    >
                      {Object.keys(CURRENCY_TYPES).map(key => {
                        const currency = CURRENCY_TYPES[key];
                        const symbol = CURRENCY_SYMBOLS[currency];
                        const name = CURRENCY_NAMES[currency];
                        return (
                          <option key={currency} value={currency}>
                            {symbol} {name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Description <span className="text-red-600">*</span></label>
                  <input
                    type="text"
                    value={paymentDescription}
                    onChange={(e) => setPaymentDescription(e.target.value)}
                    className={`w-full p-2 border-2 bg-transparent text-ink rounded text-sm ${!paymentDescription.trim() && paymentAmount ? 'border-red-400' : 'border-ink'}`}
                    placeholder="Ex: Achat d'équipement..."
                    disabled={disabled || saving}
                    required
                  />
                  {!paymentDescription.trim() && paymentAmount && (
                    <p className="text-xs text-red-600 mt-1">La description est obligatoire</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handlePayment}
                  disabled={disabled || saving || !paymentAmount || parseInt(paymentAmount) <= 0 || !paymentDescription.trim() || !canAfford(currencies, { [paymentCurrency]: parseInt(paymentAmount) || 0 })}
                  className="w-full px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                >
                  💸 Payer
                </button>
              </div>
            </div>

            {/* Formulaire de revenu (gain) */}
            <div className="p-3 border border-green-300 rounded bg-green-50/30">
              <h5 className="text-sm font-bold text-green-700 mb-2">💰 Ajouter un revenu</h5>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-ink mb-1">Montant</label>
                    <input
                      type="number"
                      min="1"
                      value={incomeAmount}
                      onChange={(e) => setIncomeAmount(e.target.value)}
                      className="w-full p-2 border-2 border-ink bg-transparent text-ink text-center rounded text-sm"
                      placeholder="0"
                      disabled={disabled || saving}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-ink mb-1">Monnaie</label>
                    <select
                      value={incomeCurrency}
                      onChange={(e) => setIncomeCurrency(e.target.value)}
                      className="w-full p-2 border-2 border-ink bg-parchment text-ink rounded text-sm"
                      disabled={disabled || saving}
                    >
                      {Object.keys(CURRENCY_TYPES).map(key => {
                        const currency = CURRENCY_TYPES[key];
                        const symbol = CURRENCY_SYMBOLS[currency];
                        const name = CURRENCY_NAMES[currency];
                        return (
                          <option key={currency} value={currency}>
                            {symbol} {name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Description <span className="text-red-600">*</span></label>
                  <input
                    type="text"
                    value={incomeDescription}
                    onChange={(e) => setIncomeDescription(e.target.value)}
                    className={`w-full p-2 border-2 bg-transparent text-ink rounded text-sm ${!incomeDescription.trim() && incomeAmount ? 'border-red-400' : 'border-ink'}`}
                    placeholder="Ex: Butin de quête, vente..."
                    disabled={disabled || saving}
                    required
                  />
                  {!incomeDescription.trim() && incomeAmount && (
                    <p className="text-xs text-red-600 mt-1">La description est obligatoire</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleIncome}
                  disabled={disabled || saving || !incomeAmount || parseInt(incomeAmount) <= 0 || !incomeDescription.trim()}
                  className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  💰 Ajouter
                </button>
              </div>
            </div>
          </div>

          {/* Historique des transactions */}
          <div>
            <h5 className="text-sm font-bold text-ink mb-2">Historique des transactions</h5>
            {loadingTransactions ? (
              <p className="text-sm text-ink/70 italic">Chargement des transactions...</p>
            ) : transactionHistory.length === 0 ? (
              <p className="text-sm text-ink/70 italic">Aucune transaction enregistrée</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {transactionHistory.map(transaction => {
                  const isIncome = transaction.type === 'income';
                  return (
                    <div
                      key={transaction.id}
                      className={`p-2 border rounded text-sm ${isIncome ? 'border-green-300 bg-green-50/30' : 'border-red-300 bg-red-50/30'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className={`font-medium ${isIncome ? 'text-green-700' : 'text-red-700'}`}>
                            {isIncome ? '💰' : '💸'} {transaction.description}
                          </div>
                          <div className="text-xs text-ink/70">
                            {isIncome ? '+' : '-'}{transaction.amount} {CURRENCY_SYMBOLS[transaction.currency]} {CURRENCY_NAMES[transaction.currency]}
                          </div>
                          <div className="text-xs text-ink/60">
                            Par {transaction.username} • {new Date(transaction.createdAt).toLocaleString('fr-FR')}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Résumé formaté */}
      <div className="text-sm text-ink/70 italic">
        {formatCurrencies(currencies, false)}
      </div>
    </div>
  );
}
