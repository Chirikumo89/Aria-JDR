import { useState, useEffect } from 'react';

export default function Checklist({ 
  items = [], 
  onChange, 
  placeholder = "Ajouter un élément...",
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

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="max-h-150 overflow-y-auto space-y-2 pr-2">
        {localItems.map((item, index) => (
        <div key={item.id} className={`flex items-center space-x-2 group ${item.checked ? 'opacity-75' : ''}`}>
          {/* Checkbox */}
          <button
            onClick={() => toggleItem(item.id)}
            disabled={disabled}
            className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 ${
              item.checked 
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
            className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
              item.checked 
                ? 'line-through text-gray-600 bg-gray-200 border-gray-400 font-medium' 
                : 'border-gray-300 hover:border-gray-400 bg-white'
            } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            autoFocus={item.isNew}
          />

          {/* Bouton supprimer */}
          <button
            onClick={() => removeItem(item.id)}
            disabled={disabled}
            className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 text-red-500 hover:text-red-700 ${
              disabled ? 'cursor-not-allowed' : 'cursor-pointer'
            }`}
            title="Supprimer cet élément"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
        ))}
      </div>

      {/* Bouton ajouter */}
      <button
        onClick={addItem}
        disabled={disabled}
        className={`w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-md text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors duration-200 ${
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
        }`}
      >
        <div className="flex items-center justify-center space-x-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Ajouter un élément</span>
        </div>
      </button>
    </div>
  );
}
