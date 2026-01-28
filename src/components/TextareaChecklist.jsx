import { useState, useEffect } from 'react';

export default function TextareaChecklist({
  items = [],
  onChange,
  placeholder = "Ajouter une note...",
  disabled = false,
  className = ""
}) {
  // S'assurer que items est toujours un tableau
  const safeItems = Array.isArray(items) ? items : [];
  const [localItems, setLocalItems] = useState(safeItems);

  // Mettre à jour les items locaux quand les props changent
  useEffect(() => {
    const safeItems = Array.isArray(items) ? items : [];
    setLocalItems(safeItems);
  }, [items]);

  const addItem = () => {
    if (disabled) return;

    const newItem = {
      id: Date.now() + Math.random(), // Utiliser Math.random pour éviter les doublons si ajout rapide
      text: '',
      checked: false,
      isNew: true // Pour auto-focus le nouvel élément
    };
    const updatedItems = [...localItems, newItem];
    setLocalItems(updatedItems);
    onChange(updatedItems);
  };

  const updateItem = (id, field, value) => {
    if (disabled) return;
    const updatedItems = localItems.map(item =>
      item.id === id ? { ...item, [field]: value, isNew: false } : item
    );
    setLocalItems(updatedItems);
    onChange(updatedItems);
  };

  const toggleItem = (id) => {
    if (disabled) return;
    const updatedItems = localItems.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setLocalItems(updatedItems);
    onChange(updatedItems);
  };

  const removeItem = (id) => {
    if (disabled) return;
    const updatedItems = localItems.filter(item => item.id !== id);
    setLocalItems(updatedItems);
    onChange(updatedItems);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="max-h-150 overflow-y-auto space-y-2 pr-2">
        {localItems.map((item, index) => (
          <div key={item.id} className={`flex items-start space-x-2 group ${item.checked ? 'opacity-75' : ''}`}>
            {/* Checkbox */}
            <button
              onClick={() => toggleItem(item.id)}
              disabled={disabled}
              className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 mt-1 ${item.checked
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

            {/* Textarea */}
            <textarea
              value={item.text}
              onChange={(e) => updateItem(item.id, 'text', e.target.value)}
              placeholder={item.isNew ? placeholder : ''}
              disabled={disabled}
              className={`flex-1 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-y ${item.checked
                  ? 'line-through text-gray-600 bg-gray-200 border-gray-400 font-medium'
                  : 'border-gray-300 hover:border-gray-400 bg-white'
                } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
              rows="3"
              autoFocus={item.isNew}
            />

            {/* Bouton supprimer */}
            <button
              onClick={() => removeItem(item.id)}
              disabled={disabled}
              className={`p-1 text-red-500 hover:text-red-700 transition-colors duration-200 opacity-0 group-hover:opacity-100 mt-1 ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm-1 3a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {!disabled && (
        <button
          onClick={addItem}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200 text-sm"
        >
          Ajouter une note
        </button>
      )}
    </div>
  );
}
