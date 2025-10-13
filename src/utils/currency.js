// Système monétaire d'Aria
// Basé sur les règles du jeu : 1 couronne = 10 orbes = 100 sceptres = 1000 rois

export const CURRENCY_TYPES = {
  CROWNS: 'crowns',    // Couronnes (or) - monnaie principale
  ORBS: 'orbs',        // Orbes (argent) - 1 couronne = 10 orbes
  SCEPTERS: 'scepters', // Sceptres (cuivre) - 1 orbe = 10 sceptres
  KINGS: 'kings'       // Rois (fer) - 1 sceptre = 10 rois
};

export const CURRENCY_NAMES = {
  [CURRENCY_TYPES.CROWNS]: 'Couronnes',
  [CURRENCY_TYPES.ORBS]: 'Orbes',
  [CURRENCY_TYPES.SCEPTERS]: 'Sceptres',
  [CURRENCY_TYPES.KINGS]: 'Rois'
};

export const CURRENCY_SYMBOLS = {
  [CURRENCY_TYPES.CROWNS]: '👑',
  [CURRENCY_TYPES.ORBS]: '🔮',
  [CURRENCY_TYPES.SCEPTERS]: '⚜️',
  [CURRENCY_TYPES.KINGS]: '👑'
};

export const CURRENCY_ALTERNATIVE_NAMES = {
  [CURRENCY_TYPES.CROWNS]: ['Couronne', 'Écu'],
  [CURRENCY_TYPES.ORBS]: ['Orbe', 'Denier'],
  [CURRENCY_TYPES.SCEPTERS]: ['Sceptre', 'Liard'],
  [CURRENCY_TYPES.KINGS]: ['Roi', 'Sou']
};

// Taux de conversion (en unités de base - rois)
export const CONVERSION_RATES = {
  [CURRENCY_TYPES.CROWNS]: 1000,  // 1 couronne = 1000 rois
  [CURRENCY_TYPES.ORBS]: 100,     // 1 orbe = 100 rois
  [CURRENCY_TYPES.SCEPTERS]: 10,  // 1 sceptre = 10 rois
  [CURRENCY_TYPES.KINGS]: 1       // 1 roi = 1 roi (unité de base)
};

/**
 * Convertit une quantité d'une monnaie vers une autre
 * @param {number} amount - Quantité à convertir
 * @param {string} fromCurrency - Monnaie source
 * @param {string} toCurrency - Monnaie cible
 * @returns {number} Quantité convertie
 */
export function convertCurrency(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return amount;
  
  // Convertir vers l'unité de base (rois)
  const amountInKings = amount * CONVERSION_RATES[fromCurrency];
  
  // Convertir vers la monnaie cible
  return Math.floor(amountInKings / CONVERSION_RATES[toCurrency]);
}

/**
 * Convertit toutes les monnaies vers une seule (optimisation)
 * @param {Object} currencies - Objet avec les quantités de chaque monnaie
 * @param {string} targetCurrency - Monnaie cible
 * @returns {number} Total converti
 */
export function convertAllToCurrency(currencies, targetCurrency) {
  let totalInKings = 0;
  
  Object.keys(CURRENCY_TYPES).forEach(key => {
    const currency = CURRENCY_TYPES[key];
    const amount = currencies[currency] || 0;
    totalInKings += amount * CONVERSION_RATES[currency];
  });
  
  return Math.floor(totalInKings / CONVERSION_RATES[targetCurrency]);
}

/**
 * Optimise les monnaies (convertit automatiquement les petites monnaies vers les plus grandes)
 * @param {Object} currencies - Objet avec les quantités de chaque monnaie
 * @returns {Object} Objet optimisé avec les conversions appliquées
 */
export function optimizeCurrencies(currencies) {
  const optimized = { ...currencies };
  
  // Convertir les rois en sceptres
  if (optimized.kings >= 10) {
    const sceptersToAdd = Math.floor(optimized.kings / 10);
    optimized.scepters = (optimized.scepters || 0) + sceptersToAdd;
    optimized.kings = optimized.kings % 10;
  }
  
  // Convertir les sceptres en orbes
  if (optimized.scepters >= 10) {
    const orbsToAdd = Math.floor(optimized.scepters / 10);
    optimized.orbs = (optimized.orbs || 0) + orbsToAdd;
    optimized.scepters = optimized.scepters % 10;
  }
  
  // Convertir les orbes en couronnes
  if (optimized.orbs >= 10) {
    const crownsToAdd = Math.floor(optimized.orbs / 10);
    optimized.crowns = (optimized.crowns || 0) + crownsToAdd;
    optimized.orbs = optimized.orbs % 10;
  }
  
  return optimized;
}

/**
 * Calcule le total en rois (unité de base)
 * @param {Object} currencies - Objet avec les quantités de chaque monnaie
 * @returns {number} Total en rois
 */
export function getTotalInKings(currencies) {
  return convertAllToCurrency(currencies, CURRENCY_TYPES.KINGS);
}

/**
 * Formate l'affichage des monnaies
 * @param {Object} currencies - Objet avec les quantités de chaque monnaie
 * @param {boolean} showEmpty - Afficher les monnaies à zéro
 * @returns {string} Chaîne formatée
 */
export function formatCurrencies(currencies, showEmpty = false) {
  const parts = [];
  
  Object.keys(CURRENCY_TYPES).forEach(key => {
    const currency = CURRENCY_TYPES[key];
    const amount = currencies[currency] || 0;
    
    if (amount > 0 || showEmpty) {
      const symbol = CURRENCY_SYMBOLS[currency];
      const name = CURRENCY_NAMES[currency];
      parts.push(`${amount} ${symbol} ${name}`);
    }
  });
  
  return parts.length > 0 ? parts.join(', ') : 'Aucune monnaie';
}

/**
 * Valide une transaction (vérifie si le personnage a assez d'argent)
 * @param {Object} characterCurrencies - Monnaies du personnage
 * @param {Object} transactionCost - Coût de la transaction
 * @returns {boolean} True si la transaction est possible
 */
export function canAfford(characterCurrencies, transactionCost) {
  const characterTotal = getTotalInKings(characterCurrencies);
  const costTotal = getTotalInKings(transactionCost);
  
  return characterTotal >= costTotal;
}

/**
 * Effectue une transaction (soustrait le coût des monnaies du personnage)
 * @param {Object} characterCurrencies - Monnaies du personnage
 * @param {Object} transactionCost - Coût de la transaction
 * @returns {Object} Nouvelles monnaies du personnage
 */
export function performTransaction(characterCurrencies, transactionCost) {
  const characterTotal = getTotalInKings(characterCurrencies);
  const costTotal = getTotalInKings(transactionCost);
  
  if (characterTotal < costTotal) {
    throw new Error('Fonds insuffisants pour cette transaction');
  }
  
  const remainingKings = characterTotal - costTotal;
  
  // Convertir les rois restants en monnaies optimisées
  const result = {
    crowns: 0,
    orbs: 0,
    scepters: 0,
    kings: remainingKings
  };
  
  return optimizeCurrencies(result);
}
