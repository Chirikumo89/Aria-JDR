import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function Checklist({
  items = [],
  onChange,
  placeholder = "Ajouter un élément...",
  disabled = false,
  className = "",
  enableTransfer = false,
  onTransferItem = null,
  availableCharacters = [] // Liste des personnages pour le sous-menu de transfert
}) {
  // S'assurer que items est toujours un tableau
  const safeItems = Array.isArray(items) ? items : [];
  const [localItems, setLocalItems] = useState(safeItems);

  // État pour le menu contextuel
  const [contextMenu, setContextMenu] = useState(null); // { x, y, item }
  const [showTransferSubmenu, setShowTransferSubmenu] = useState(false);
  const menuRef = useRef(null);
  const submenuRef = useRef(null);
  const transferButtonRef = useRef(null);

  // Mettre à jour les items locaux quand les props changent
  useEffect(() => {
    const safeItems = Array.isArray(items) ? items : [];
    setLocalItems(safeItems);
  }, [items]);

  // Fermer le menu contextuel quand on clique ailleurs, scroll, ou touche Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Vérifier si le clic est en dehors du menu ET du sous-menu
      const isOutsideMenu = menuRef.current && !menuRef.current.contains(e.target);
      const isOutsideSubmenu = !submenuRef.current || !submenuRef.current.contains(e.target);

      if (isOutsideMenu && isOutsideSubmenu) {
        setContextMenu(null);
        setShowTransferSubmenu(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
        setShowTransferSubmenu(false);
      }
    };

    // Fermer le menu quand on scroll (sauf dans le sous-menu)
    const handleScroll = (e) => {
      // Ne pas fermer si le scroll vient du sous-menu
      if (submenuRef.current && submenuRef.current.contains(e.target)) {
        return;
      }
      setContextMenu(null);
      setShowTransferSubmenu(false);
    };

    if (contextMenu) {
      // Utiliser 'click' au lieu de 'mousedown' pour permettre aux boutons du sous-menu de recevoir leur clic
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      window.addEventListener('scroll', handleScroll, true); // true pour capturer aussi les scrolls dans les éléments enfants
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [contextMenu]);

  // Gestionnaire du clic droit
  const handleContextMenu = (e, item) => {
    e.preventDefault();
    e.stopPropagation();

    // Calculer la position pour éviter que le menu sorte de l'écran
    const x = Math.min(e.clientX, window.innerWidth - 200);
    const y = Math.min(e.clientY, window.innerHeight - 300);

    setContextMenu({
      x,
      y,
      item
    });
    setShowTransferSubmenu(false);
  };

  const addItem = () => {
    if (disabled) return;

    const newItem = {
      id: Date.now() + Math.random(),
      text: '',
      checked: false,
      isNew: true
    };

    const updatedItems = [...localItems, newItem];
    setLocalItems(updatedItems);
    onChange?.(updatedItems);
  };

  const updateItem = (id, field, value) => {
    if (disabled) return;

    const updatedItems = localItems.map(item =>
      item.id === id ? { ...item, [field]: value, isNew: false } : item
    );
    setLocalItems(updatedItems);
    onChange?.(updatedItems);
  };

  const removeItem = (id) => {
    if (disabled) return;

    const updatedItems = localItems.filter(item => item.id !== id);
    setLocalItems(updatedItems);
    onChange?.(updatedItems);
  };

  const toggleItem = (id) => {
    if (disabled) return;

    const updatedItems = localItems.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setLocalItems(updatedItems);
    onChange?.(updatedItems);
  };

  // Actions du menu contextuel
  const handleMenuAction = (action, targetCharacter = null) => {
    if (!contextMenu?.item) return;

    switch (action) {
      case 'transfer':
        if (onTransferItem && contextMenu.item.text) {
          // Passer l'item et le personnage cible présélectionné
          onTransferItem(contextMenu.item, targetCharacter);
        }
        break;
      case 'delete':
        removeItem(contextMenu.item.id);
        break;
      case 'toggle':
        toggleItem(contextMenu.item.id);
        break;
    }

    setContextMenu(null);
    setShowTransferSubmenu(false);
  };

  // Calculer la position du sous-menu
  const getSubmenuPosition = () => {
    if (!transferButtonRef.current || !contextMenu) return { left: 0, top: 0 };

    const rect = transferButtonRef.current.getBoundingClientRect();
    const submenuWidth = 200;
    const submenuHeight = Math.min(availableCharacters.length * 44 + 8, 300);

    // Par défaut, afficher à droite
    let left = rect.right + 4;
    let top = rect.top;

    // Si ça dépasse à droite, afficher à gauche
    if (left + submenuWidth > window.innerWidth - 10) {
      left = rect.left - submenuWidth - 4;
    }

    // Si ça dépasse en bas, ajuster
    if (top + submenuHeight > window.innerHeight - 10) {
      top = window.innerHeight - submenuHeight - 10;
    }

    return { left, top };
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="max-h-150 overflow-y-auto space-y-2 pr-2">
        {localItems.map((item, index) => (
          <div
            key={item.id}
            className={`flex items-center space-x-2 group ${item.checked ? 'opacity-75' : ''}`}
            onContextMenu={(e) => handleContextMenu(e, item)}
          >
            {/* Checkbox */}
            <button
              onClick={() => toggleItem(item.id)}
              disabled={disabled}
              className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 ${item.checked
                  ? 'bg-green-600 border-green-600 text-white shadow-lg ring-2 ring-green-200'
                  : 'border-gray-400 hover:border-gray-500 bg-white hover:bg-gray-50 shadow-sm'
                } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-105'}`}
            >
              {item.checked && (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {/* Input text */}
            <input
              type="text"
              value={item.text}
              onChange={(e) => updateItem(item.id, 'text', e.target.value)}
              placeholder={item.isNew ? placeholder : ''}
              disabled={disabled}
              className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${item.checked
                  ? 'line-through text-gray-600 bg-gray-200 border-gray-400 font-medium'
                  : 'border-gray-300 hover:border-gray-400 bg-white'
                } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
              autoFocus={item.isNew}
              onContextMenu={(e) => handleContextMenu(e, item)}
            />
          </div>
        ))}
      </div>

      {/* Bouton ajouter */}
      <button
        onClick={addItem}
        disabled={disabled}
        className={`w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-md text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors duration-200 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          }`}
      >
        <div className="flex items-center justify-center space-x-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Ajouter un élément</span>
        </div>
      </button>

      {/* Menu contextuel - rendu dans un portail pour éviter les problèmes de z-index et overflow */}
      {contextMenu && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[9999] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 min-w-48"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            animation: 'scaleIn 0.15s ease-out'
          }}
        >
          {/* En-tête du menu avec l'item sélectionné */}
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 mb-1">
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-40">
              {contextMenu.item.text || 'Item sans nom'}
            </p>
          </div>

          {/* Option: Cocher/Décocher */}
          <button
            onClick={() => !disabled && handleMenuAction('toggle')}
            disabled={disabled}
            className={`w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors text-gray-700 dark:text-gray-200 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'
              }`}
          >
            {contextMenu.item.checked ? (
              <>
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Marquer non fait</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Marquer comme fait</span>
              </>
            )}
          </button>

          {/* Option: Transférer avec sous-menu (si activé et item a du texte) */}
          {enableTransfer && onTransferItem && contextMenu.item.text && (
            <div className="relative">
              <button
                ref={transferButtonRef}
                onMouseEnter={() => setShowTransferSubmenu(true)}
                onClick={() => !disabled && handleMenuAction('transfer', null)}
                disabled={disabled}
                className={`w-full px-4 py-2.5 text-left flex items-center justify-between transition-colors text-blue-600 dark:text-blue-400 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span>Transférer</span>
                </div>
                {availableCharacters.length > 0 && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
          )}

          {/* Séparateur */}
          <div className="my-1 border-t border-gray-200 dark:border-gray-700"></div>

          {/* Option: Supprimer */}
          <button
            onClick={() => !disabled && handleMenuAction('delete')}
            disabled={disabled}
            className={`w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors text-red-600 dark:text-red-400 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-50 dark:hover:bg-red-900/30 cursor-pointer'
              }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Supprimer</span>
          </button>
        </div>,
        document.body
      )}

      {/* Sous-menu de transfert avec liste des joueurs */}
      {contextMenu && showTransferSubmenu && availableCharacters.length > 0 && createPortal(
        <div
          ref={submenuRef}
          className="fixed z-[10000] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 min-w-48 max-h-72 overflow-y-auto"
          style={{
            ...getSubmenuPosition(),
            animation: 'scaleIn 0.1s ease-out'
          }}
          onMouseEnter={() => setShowTransferSubmenu(true)}
          onMouseLeave={() => setShowTransferSubmenu(false)}
          onScroll={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 mb-1">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Transférer à...
            </p>
          </div>
          {availableCharacters.map(character => (
            <button
              key={character.id}
              onClick={() => !disabled && handleMenuAction('transfer', character)}
              disabled={disabled}
              className={`w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors text-gray-700 dark:text-gray-200 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer'
                }`}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                {character.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{character.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{character.playerName}</p>
              </div>
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
