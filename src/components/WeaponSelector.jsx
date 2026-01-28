import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MELEE_WEAPONS, RANGED_WEAPONS, ARMORS } from '../data/weapons';

export default function WeaponSelector({ onSelect, disabled = false, showPrices = true }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('melee');
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 420;
      const dropdownWidth = 340;

      let top = rect.bottom + 8;
      let left = rect.left;

      if (top + dropdownHeight > window.innerHeight) {
        top = rect.top - dropdownHeight - 8;
      }
      if (left + dropdownWidth > window.innerWidth) {
        left = window.innerWidth - dropdownWidth - 16;
      }
      if (left < 16) left = 16;

      setPosition({ top, left });
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (weapon) => {
    onSelect(weapon.name, weapon.damage || '');
    setIsOpen(false);
    setSearch('');
  };

  const filterWeapons = (weapons) => {
    if (!search) return weapons;
    return weapons.filter(w =>
      w.name.toLowerCase().includes(search.toLowerCase())
    );
  };

  const getWeaponsForTab = () => {
    switch (activeTab) {
      case 'melee':
        return filterWeapons(MELEE_WEAPONS);
      case 'ranged':
        return filterWeapons(RANGED_WEAPONS);
      default:
        return [];
    }
  };

  if (disabled) return null;

  const dropdown = isOpen && createPortal(
    <div
      ref={dropdownRef}
      className="fixed"
      style={{
        top: position.top,
        left: position.left,
        zIndex: 99999,
        width: 340
      }}
    >
      <div className="bg-amber-50 rounded-lg shadow-xl border border-amber-300 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 to-amber-800 px-4 py-3 flex items-center justify-between">
          <h3 className="text-white font-bold flex items-center gap-2">
            <span>⚔️</span> Catalogue d'armes
          </h3>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-amber-200 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Onglets */}
        <div className="flex border-b border-amber-200">
          <button
            type="button"
            onClick={() => setActiveTab('melee')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'melee'
                ? 'bg-amber-100 text-amber-900 border-b-2 border-amber-600'
                : 'text-amber-700 hover:bg-amber-50'
              }`}
          >
            <span>🗡️</span> Corps à corps
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ranged')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'ranged'
                ? 'bg-amber-100 text-amber-900 border-b-2 border-amber-600'
                : 'text-amber-700 hover:bg-amber-50'
              }`}
          >
            <span>🏹</span> Distance
          </button>
        </div>

        {/* Recherche */}
        <div className="p-3 bg-amber-50 border-b border-amber-200">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>
        </div>

        {/* Liste */}
        <div className="max-h-64 overflow-y-auto">
          {/* Option aucune arme */}
          <button
            type="button"
            onClick={() => handleSelect({ name: '', damage: '' })}
            className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center gap-3 border-b border-amber-100"
          >
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-medium text-slate-600 text-sm">Aucune arme</div>
              <div className="text-xs text-slate-400">Vider cet emplacement</div>
            </div>
          </button>

          {getWeaponsForTab().length === 0 ? (
            <div className="p-6 text-center text-amber-600">
              <div className="text-3xl mb-2">🔍</div>
              <div className="text-sm">Aucune arme trouvée</div>
            </div>
          ) : (
            getWeaponsForTab().map((weapon, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelect(weapon)}
                className="w-full px-4 py-3 text-left hover:bg-amber-100 transition-colors flex items-center gap-3 border-b border-amber-100 last:border-b-0"
              >
                <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 font-bold text-xs">
                  {activeTab === 'melee' ? '⚔️' : '🎯'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-amber-900 text-sm truncate">{weapon.name}</div>
                  <div className="text-xs text-amber-600 truncate">
                    {weapon.usage || weapon.range}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="px-2 py-1 bg-red-600 text-white rounded text-xs font-bold shadow-sm">
                    {weapon.damage || '-'}
                  </div>
                  {showPrices && (
                    <div className="text-xs text-amber-500 mt-1">{weapon.price.split(' ')[0]} {weapon.price.split(' ')[1]}</div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors shadow-sm"
        title="Choisir une arme"
      >
        <span>⚔️</span>
        <span className="hidden sm:inline">Catalogue</span>
      </button>
      {dropdown}
    </>
  );
}

export function ArmorSelector({ onSelect, disabled = false, showPrices = true }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 320;
      const dropdownWidth = 300;

      let top = rect.bottom + 8;
      let left = rect.left;

      if (top + dropdownHeight > window.innerHeight) {
        top = rect.top - dropdownHeight - 8;
      }
      if (left + dropdownWidth > window.innerWidth) {
        left = window.innerWidth - dropdownWidth - 16;
      }
      if (left < 16) left = 16;

      setPosition({ top, left });
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (armor) => {
    onSelect(armor.protection, armor.name);
    setIsOpen(false);
  };

  if (disabled) return null;

  const dropdown = isOpen && createPortal(
    <div
      ref={dropdownRef}
      className="fixed"
      style={{
        top: position.top,
        left: position.left,
        zIndex: 99999,
        width: 300
      }}
    >
      <div className="bg-amber-50 rounded-lg shadow-xl border border-amber-300 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-700 to-red-800 px-4 py-3 flex items-center justify-between">
          <h3 className="text-white font-bold flex items-center gap-2">
            <span>🛡️</span> Armures
          </h3>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-red-200 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Liste */}
        <div className="max-h-64 overflow-y-auto">
          {/* Sans armure */}
          <button
            type="button"
            onClick={() => handleSelect({ protection: 0, name: '' })}
            className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center gap-3 border-b border-amber-100"
          >
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-medium text-slate-600">Sans armure</div>
              <div className="text-xs text-slate-400">Aucune protection</div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-slate-300 flex items-center justify-center text-slate-600 font-bold text-lg">
              0
            </div>
          </button>

          {ARMORS.map((armor, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(armor)}
              className="w-full px-4 py-3 text-left hover:bg-amber-100 transition-colors flex items-center gap-3 border-b border-amber-100 last:border-b-0"
            >
              <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-2xl">
                🛡️
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-amber-900">{armor.name}</div>
                {showPrices && (
                  <div className="text-xs text-amber-600">{armor.price}</div>
                )}
                {armor.malus && (
                  <div className="text-xs text-red-600 mt-0.5">{armor.malus}</div>
                )}
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold text-lg shadow-md">
                +{armor.protection}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1 text-xs bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors shadow-sm"
        title="Choisir une armure"
      >
        <span>🛡️</span>
      </button>
      {dropdown}
    </>
  );
}
