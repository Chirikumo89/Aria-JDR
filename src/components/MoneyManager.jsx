import { useState, useEffect } from 'react';
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
import { apiService } from '../services/api';
import CurrencyHelp from './CurrencyHelp';

export default function MoneyManager({ currencies, onChange, disabled = false, characterId }) {
  const [showConverter, setShowConverter] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [conversionAmount, setConversionAmount] = useState('');
  const [conversionFrom, setConversionFrom] = useState(CURRENCY_TYPES.KINGS);
  const [conversionTo, setConversionTo] = useState(CURRENCY_TYPES.CROWNS);
  
  // États pour les transactions
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentCurrency, setPaymentCurrency] = useState(CURRENCY_TYPES.KINGS);
  const [paymentDescription, setPaymentDescription] = useState('');
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Charger les transactions depuis la base de données
  useEffect(() => {
    if (characterId && showTransactions) {
      loadTransactions();
    }
  }, [characterId, showTransactions]);

  const loadTransactions = async () => {
    if (!characterId) return;
    
    try {
      setLoadingTransactions(true);
      const transactions = await apiService.getCharacterTransactions(characterId);
      setTransactionHistory(transactions);
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleCurrencyChange = (currencyType, value) => {
    const newCurrencies = { ...currencies };
    newCurrencies[currencyType] = Math.max(0, parseInt(value) || 0);
    
    // Optimiser automatiquement les monnaies
    const optimized = optimizeCurrencies(newCurrencies);
    onChange(optimized);
  };

  const handleOptimize = () => {
    const optimized = optimizeCurrencies(currencies);
    onChange(optimized);
  };

  const handleConversion = () => {
    const amount = parseInt(conversionAmount) || 0;
    if (amount <= 0) return;

    const convertedAmount = convertCurrency(amount, conversionFrom, conversionTo);
    const newCurrencies = { ...currencies };
    
    // Soustraire de la monnaie source
    newCurrencies[conversionFrom] = Math.max(0, (newCurrencies[conversionFrom] || 0) - amount);
    
    // Ajouter à la monnaie cible
    newCurrencies[conversionTo] = (newCurrencies[conversionTo] || 0) + convertedAmount;
    
    const optimized = optimizeCurrencies(newCurrencies);
    onChange(optimized);
    
    // Reset du convertisseur
    setConversionAmount('');
  };

  // Fonction pour effectuer un paiement
  const handlePayment = async () => {
    const amount = parseInt(paymentAmount) || 0;
    if (amount <= 0) return;

    const paymentCost = { [paymentCurrency]: amount };
    
    if (!canAfford(currencies, paymentCost)) {
      alert('Fonds insuffisants pour ce paiement !');
      return;
    }

    try {
      const newCurrencies = performTransaction(currencies, paymentCost);
      onChange(newCurrencies);
      
      // Sauvegarder la transaction en base de données
      if (characterId) {
        const transactionData = {
          type: 'payment',
          amount: amount,
          currency: paymentCurrency,
          description: paymentDescription || 'Paiement'
        };
        
        const savedTransaction = await apiService.createTransaction(characterId, transactionData);
        
        // Ajouter à l'historique local
        setTransactionHistory(prev => [savedTransaction, ...prev]);
      } else {
        // Fallback pour les cas sans characterId (mode local)
        const transaction = {
          id: Date.now(),
          type: 'payment',
          amount: amount,
          currency: paymentCurrency,
          description: paymentDescription || 'Paiement',
          createdAt: new Date()
        };
        
        setTransactionHistory(prev => [transaction, ...prev]);
      }
      
      // Reset du formulaire de paiement
      setPaymentAmount('');
      setPaymentDescription('');
      
    } catch (error) {
      console.error('Erreur lors du paiement:', error);
      alert(error.message || 'Erreur lors du paiement');
    }
  };


  const totalInKings = getTotalInKings(currencies);

  return (
    <div className="space-y-4">
      {/* En-tête avec total */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-ink">💰 FORTUNE</h3>
          <CurrencyHelp />
        </div>
        <div className="text-sm text-ink/70">
          Total: {totalInKings} rois
        </div>
      </div>

      {/* Affichage des monnaies */}
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
              <input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => handleCurrencyChange(currency, e.target.value)}
                className="w-full p-2 border-2 border-ink bg-transparent text-ink text-center rounded"
                disabled={disabled}
                placeholder="0"
              />
            </div>
          );
        })}
      </div>

      {/* Boutons d'action */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleOptimize}
          disabled={disabled}
          className="px-3 py-1 bg-ink text-parchment rounded text-sm hover:bg-ink/80 disabled:opacity-50"
        >
          🔄 Optimiser
        </button>
        <button
          onClick={() => setShowConverter(!showConverter)}
          disabled={disabled}
          className="px-3 py-1 bg-ink text-parchment rounded text-sm hover:bg-ink/80 disabled:opacity-50"
        >
          🔀 Convertir
        </button>
        <button
          onClick={() => setShowTransactions(!showTransactions)}
          disabled={disabled}
          className="px-3 py-1 bg-ink text-parchment rounded text-sm hover:bg-ink/80 disabled:opacity-50"
        >
          💳 Transactions
        </button>
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
                disabled={disabled}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-ink mb-1">De</label>
              <select
                value={conversionFrom}
                onChange={(e) => setConversionFrom(e.target.value)}
                className="w-full p-2 border-2 border-ink bg-parchment text-ink rounded"
                disabled={disabled}
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
                disabled={disabled}
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
              onClick={handleConversion}
              disabled={disabled || !conversionAmount || conversionFrom === conversionTo || (currencies[conversionFrom] || 0) < (parseInt(conversionAmount) || 0)}
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
          <h4 className="text-md font-bold text-ink mb-3">💳 Transactions</h4>
          
          {/* Formulaire de paiement */}
          <div className="mb-4 p-3 border border-ink/30 rounded bg-parchment/30">
            <h5 className="text-sm font-bold text-ink mb-2">Effectuer un paiement</h5>
            <div className="grid grid-cols-3 gap-2 items-end">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Montant</label>
                <input
                  type="number"
                  min="1"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-2 border-2 border-ink bg-transparent text-ink text-center rounded text-sm"
                  placeholder="0"
                  disabled={disabled}
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Monnaie</label>
                <select
                  value={paymentCurrency}
                  onChange={(e) => setPaymentCurrency(e.target.value)}
                  className="w-full p-2 border-2 border-ink bg-parchment text-ink rounded text-sm"
                  disabled={disabled}
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
                <button
                  onClick={handlePayment}
                  disabled={disabled || !paymentAmount || parseInt(paymentAmount) <= 0 || !canAfford(currencies, { [paymentCurrency]: parseInt(paymentAmount) || 0 })}
                  className="w-full px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                >
                  Payer
                </button>
              </div>
            </div>
            
            <div className="mt-2">
              <label className="block text-xs font-medium text-ink mb-1">Description (optionnel)</label>
              <input
                type="text"
                value={paymentDescription}
                onChange={(e) => setPaymentDescription(e.target.value)}
                className="w-full p-2 border-2 border-ink bg-transparent text-ink rounded text-sm"
                placeholder="Ex: Achat d'armure, Repas au tavern..."
                disabled={disabled}
              />
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
                {transactionHistory.map(transaction => (
                  <div key={transaction.id} className="p-2 border border-ink/30 rounded text-sm bg-parchment/30">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-ink">
                          💸 {transaction.description}
                        </div>
                        <div className="text-xs text-ink/70">
                          {transaction.amount} {CURRENCY_SYMBOLS[transaction.currency]} {CURRENCY_NAMES[transaction.currency]}
                        </div>
                        <div className="text-xs text-ink/50">
                          {new Date(transaction.createdAt).toLocaleString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
