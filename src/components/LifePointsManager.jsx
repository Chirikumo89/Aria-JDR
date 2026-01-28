import { useState, useEffect } from 'react';

export default function LifePointsManager({
  lifePoints,
  currentLifePoints,
  onChange,
  disabled = false,
  characterId,
  compact = false
}) {
  const [localCurrentLifePoints, setLocalCurrentLifePoints] = useState(currentLifePoints || lifePoints || 0);
  const [inputValue, setInputValue] = useState('');

  // Mettre à jour les PV actuels quand les props changent
  useEffect(() => {
    setLocalCurrentLifePoints(currentLifePoints || lifePoints || 0);
  }, [currentLifePoints, lifePoints]);

  const handleAddLifePoints = (amount) => {
    const newValue = Math.min(localCurrentLifePoints + amount, lifePoints || 0);
    console.log('🔄 LifePointsManager: Adding', amount, 'PV. New value:', newValue);
    setLocalCurrentLifePoints(newValue);
    if (onChange) {
      console.log('📤 LifePointsManager: Calling onChange with:', { currentLifePoints: newValue });
      onChange({ currentLifePoints: newValue });
    }
  };

  const handleSubtractLifePoints = (amount) => {
    const newValue = Math.max(localCurrentLifePoints - amount, 0);
    console.log('🔄 LifePointsManager: Subtracting', amount, 'PV. New value:', newValue);
    setLocalCurrentLifePoints(newValue);
    if (onChange) {
      console.log('📤 LifePointsManager: Calling onChange with:', { currentLifePoints: newValue });
      onChange({ currentLifePoints: newValue });
    }
  };

  const handleCustomChange = () => {
    const value = parseInt(inputValue);
    if (!isNaN(value)) {
      const newValue = Math.max(0, Math.min(value, lifePoints || 0));
      setLocalCurrentLifePoints(newValue);
      setInputValue('');
      if (onChange) {
        onChange({ currentLifePoints: newValue });
      }
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleCustomChange();
    }
  };

  const handleFullHeal = () => {
    const newValue = lifePoints || 0;
    setLocalCurrentLifePoints(newValue);
    if (onChange) {
      onChange({ currentLifePoints: newValue });
    }
  };

  const getLifePointsColor = () => {
    const percentage = lifePoints > 0 ? (localCurrentLifePoints / lifePoints) * 100 : 0;
    if (percentage >= 75) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    if (percentage >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  const getLifePointsBarColor = () => {
    const percentage = lifePoints > 0 ? (localCurrentLifePoints / lifePoints) * 100 : 0;
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Mode compact pour le dashboard
  if (compact) {
    return (
      <div className="space-y-3">
        {/* Affichage PV */}
        <div className="text-center">
          <span className={`text-2xl font-bold ${getLifePointsColor()}`}>
            {localCurrentLifePoints}
          </span>
          <span className="text-lg text-ink/60"> / {lifePoints || 0}</span>
        </div>

        {/* Barre de vie */}
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${getLifePointsBarColor()}`}
            style={{ width: lifePoints > 0 ? `${(localCurrentLifePoints / lifePoints) * 100}%` : '0%' }}
          />
        </div>

        {/* Boutons +/- */}
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => handleSubtractLifePoints(5)}
            disabled={disabled || localCurrentLifePoints <= 0}
            className="px-2 py-1.5 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            -5
          </button>
          <button
            onClick={() => handleSubtractLifePoints(1)}
            disabled={disabled || localCurrentLifePoints <= 0}
            className="px-2 py-1.5 bg-red-500 text-white rounded text-xs hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            -1
          </button>
          <button
            onClick={() => handleAddLifePoints(1)}
            disabled={disabled || localCurrentLifePoints >= (lifePoints || 0)}
            className="px-2 py-1.5 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            +1
          </button>
          <button
            onClick={() => handleAddLifePoints(5)}
            disabled={disabled || localCurrentLifePoints >= (lifePoints || 0)}
            className="px-2 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            +5
          </button>
        </div>

        {/* Soin complet */}
        <button
          onClick={handleFullHeal}
          disabled={disabled || localCurrentLifePoints >= (lifePoints || 0)}
          className="w-full px-2 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Soin complet
        </button>
      </div>
    );
  }

  return (
    <div className="bg-parchment/50 p-4 rounded-lg border border-ink/20">
      <h3 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
        <span className="text-2xl">❤️</span>
        Gestion des Points de Vie
      </h3>

      {/* Affichage des PV */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-ink">Points de Vie:</span>
          <span className={`text-lg font-bold ${getLifePointsColor()}`}>
            {localCurrentLifePoints} / {lifePoints || 0}
          </span>
        </div>

        {/* Barre de vie */}
        <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
          <div
            className={`h-4 rounded-full transition-all duration-300 ${getLifePointsBarColor()}`}
            style={{
              width: lifePoints > 0 ? `${(localCurrentLifePoints / lifePoints) * 100}%` : '0%'
            }}
          ></div>
        </div>

        <div className="text-xs text-ink/70 text-center">
          {lifePoints > 0 ? `${Math.round((localCurrentLifePoints / lifePoints) * 100)}%` : '0%'} de vie
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => handleAddLifePoints(1)}
          disabled={disabled || localCurrentLifePoints >= (lifePoints || 0)}
          className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 text-sm"
        >
          +1 PV
        </button>
        <button
          onClick={() => handleSubtractLifePoints(1)}
          disabled={disabled || localCurrentLifePoints <= 0}
          className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 text-sm"
        >
          -1 PV
        </button>
        <button
          onClick={() => handleAddLifePoints(5)}
          disabled={disabled || localCurrentLifePoints >= (lifePoints || 0)}
          className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 text-sm"
        >
          +5 PV
        </button>
        <button
          onClick={() => handleSubtractLifePoints(5)}
          disabled={disabled || localCurrentLifePoints <= 0}
          className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 text-sm"
        >
          -5 PV
        </button>
      </div>

      {/* Soin complet */}
      <div className="mb-4">
        <button
          onClick={handleFullHeal}
          disabled={disabled || localCurrentLifePoints >= (lifePoints || 0)}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
        >
          💚 Soin Complet
        </button>
      </div>

      {/* Modification manuelle */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-ink">
          Modifier les PV manuellement:
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Nouveaux PV"
            min="0"
            max={lifePoints || 0}
            disabled={disabled}
            className="flex-1 px-3 py-2 border border-ink/30 rounded bg-transparent text-ink placeholder-ink/50 focus:outline-none focus:border-ink disabled:bg-gray-100 disabled:text-gray-500"
          />
          <button
            onClick={handleCustomChange}
            disabled={disabled || !inputValue || isNaN(parseInt(inputValue))}
            className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 text-sm"
          >
            Appliquer
          </button>
        </div>
        <div className="text-xs text-ink/60">
          Valeur entre 0 et {lifePoints || 0}
        </div>
      </div>

      {/* Indicateur d'état critique */}
      {localCurrentLifePoints <= (lifePoints || 0) * 0.25 && localCurrentLifePoints > 0 && (
        <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm text-center">
          ⚠️ État critique ! Le personnage est gravement blessé.
        </div>
      )}

      {localCurrentLifePoints <= 0 && (
        <div className="mt-3 p-2 bg-red-200 border border-red-400 rounded text-red-800 text-sm text-center font-bold">
          💀 Le personnage est inconscient !
        </div>
      )}
    </div>
  );
}
