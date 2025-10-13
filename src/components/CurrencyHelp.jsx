import { useState } from 'react';
import { CURRENCY_TYPES, CURRENCY_NAMES, CURRENCY_SYMBOLS, CURRENCY_ALTERNATIVE_NAMES } from '../utils/currency';

export default function CurrencyHelp() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm text-ink/60 hover:text-ink underline"
      >
        ℹ️ Aide système monétaire
      </button>
      
      {isOpen && (
        <div className="absolute top-6 left-0 z-50 bg-parchment border-2 border-ink rounded-lg p-4 shadow-lg max-w-md">
          <div className="space-y-3">
            <h4 className="font-bold text-ink">Système monétaire d'Aria</h4>
            
            <div className="text-sm text-ink/80">
              <p className="mb-2">Quatre types de pièces ont cours en Aria :</p>
              
              <div className="space-y-2">
                {Object.keys(CURRENCY_TYPES).map(key => {
                  const currency = CURRENCY_TYPES[key];
                  const symbol = CURRENCY_SYMBOLS[currency];
                  const name = CURRENCY_NAMES[currency];
                  const alternatives = CURRENCY_ALTERNATIVE_NAMES[currency];
                  
                  return (
                    <div key={currency} className="flex items-center gap-2">
                      <span className="text-lg">{symbol}</span>
                      <div>
                        <div className="font-medium">{name}</div>
                        <div className="text-xs text-ink/60">
                          Aussi appelées : {alternatives.join(', ')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-3 p-2 bg-ink/10 rounded">
                <p className="text-xs font-medium mb-1">Taux de conversion :</p>
                <p className="text-xs">1 Couronne = 10 Orbes = 100 Sceptres = 1000 Rois</p>
              </div>
              
              <div className="mt-3 text-xs text-ink/60">
                <p>💡 <strong>Astuce :</strong> Utilisez le bouton "Optimiser" pour convertir automatiquement les petites monnaies vers les plus grandes.</p>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="w-full mt-3 px-3 py-1 bg-ink text-parchment rounded text-sm hover:bg-ink/80"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
