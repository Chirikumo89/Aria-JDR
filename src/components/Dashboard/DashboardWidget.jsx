import { useState, useEffect } from 'react';

const SIZE_OPTIONS = [
  { key: 'auto', label: 'Auto', height: 'auto' },
  { key: 'xs', label: 'XS', height: '120px' },
  { key: 's', label: 'S', height: '180px' },
  { key: 'm', label: 'M', height: '250px' },
  { key: 'l', label: 'L', height: '350px' },
  { key: 'xl', label: 'XL', height: '500px' }
];

const WIDGET_SIZES_KEY = 'aria-widget-sizes';

export default function DashboardWidget({
  title,
  icon,
  children,
  color = 'amber',
  collapsible = true,
  defaultCollapsed = false,
  defaultSize = 'auto',
  widgetId,
  className = ''
}) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [sizeKey, setSizeKey] = useState(() => {
    if (widgetId) {
      const saved = localStorage.getItem(WIDGET_SIZES_KEY);
      if (saved) {
        const sizes = JSON.parse(saved);
        return sizes[widgetId] || defaultSize;
      }
    }
    return defaultSize;
  });

  // Sauvegarder la taille quand elle change
  useEffect(() => {
    if (widgetId) {
      const saved = localStorage.getItem(WIDGET_SIZES_KEY);
      const sizes = saved ? JSON.parse(saved) : {};
      sizes[widgetId] = sizeKey;
      localStorage.setItem(WIDGET_SIZES_KEY, JSON.stringify(sizes));
    }
  }, [sizeKey, widgetId]);

  const cycleSize = (e) => {
    e.stopPropagation();
    const currentIndex = SIZE_OPTIONS.findIndex(s => s.key === sizeKey);
    const nextIndex = (currentIndex + 1) % SIZE_OPTIONS.length;
    setSizeKey(SIZE_OPTIONS[nextIndex].key);
  };

  const currentSize = SIZE_OPTIONS.find(s => s.key === sizeKey) || SIZE_OPTIONS[0];

  const colorClasses = {
    amber: {
      bg: 'from-amber-50/80 to-amber-100/60',
      border: 'border-amber-200/50',
      header: 'bg-amber-800',
      headerHover: 'hover:bg-amber-700'
    },
    red: {
      bg: 'from-red-50/80 to-red-100/60',
      border: 'border-red-200/50',
      header: 'bg-red-800',
      headerHover: 'hover:bg-red-700'
    },
    blue: {
      bg: 'from-blue-50/80 to-blue-100/60',
      border: 'border-blue-200/50',
      header: 'bg-blue-800',
      headerHover: 'hover:bg-blue-700'
    },
    green: {
      bg: 'from-green-50/80 to-green-100/60',
      border: 'border-green-200/50',
      header: 'bg-green-800',
      headerHover: 'hover:bg-green-700'
    },
    purple: {
      bg: 'from-purple-50/80 to-purple-100/60',
      border: 'border-purple-200/50',
      header: 'bg-purple-800',
      headerHover: 'hover:bg-purple-700'
    },
    orange: {
      bg: 'from-orange-50/80 to-orange-100/60',
      border: 'border-orange-200/50',
      header: 'bg-orange-800',
      headerHover: 'hover:bg-orange-700'
    },
    yellow: {
      bg: 'from-yellow-50/80 to-yellow-100/60',
      border: 'border-yellow-200/50',
      header: 'bg-yellow-700',
      headerHover: 'hover:bg-yellow-600'
    },
    slate: {
      bg: 'from-slate-50/80 to-slate-100/60',
      border: 'border-slate-200/50',
      header: 'bg-slate-700',
      headerHover: 'hover:bg-slate-600'
    },
    emerald: {
      bg: 'from-emerald-50/80 to-emerald-100/60',
      border: 'border-emerald-200/50',
      header: 'bg-emerald-700',
      headerHover: 'hover:bg-emerald-600'
    },
    cyan: {
      bg: 'from-cyan-50/80 to-cyan-100/60',
      border: 'border-cyan-200/50',
      header: 'bg-cyan-700',
      headerHover: 'hover:bg-cyan-600'
    }
  };

  const colors = colorClasses[color] || colorClasses.amber;

  const contentStyle = currentSize.height !== 'auto'
    ? { maxHeight: currentSize.height, height: currentSize.height }
    : {};

  return (
    <div className={`flex flex-col rounded-xl bg-gradient-to-br ${colors.bg} border-2 ${colors.border} shadow-md overflow-hidden ${className}`}>
      {/* Header - zone de drag */}
      <div
        className={`widget-drag-handle flex items-center justify-between ${colors.header} text-white px-3 py-2 cursor-move select-none`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {icon && <span className="text-lg flex-shrink-0">{icon}</span>}
          <h3 className="font-bold text-sm truncate">{title}</h3>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Bouton taille */}
          <button
            type="button"
            onClick={cycleSize}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${colors.headerHover} transition-colors bg-white/20`}
            title={`Taille: ${currentSize.label} (cliquer pour changer)`}
          >
            {currentSize.label}
          </button>
          {collapsible && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsCollapsed(!isCollapsed);
              }}
              className={`p-1 rounded ${colors.headerHover} transition-colors`}
              title={isCollapsed ? 'Déplier' : 'Replier'}
            >
              <svg
                className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
          <div className="p-1 opacity-50">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM6 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM14 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM14 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM20 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM18 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM20 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Content avec scroll si nécessaire */}
      {!isCollapsed && (
        <div
          className="flex-1 overflow-auto p-3"
          style={contentStyle}
        >
          {children}
        </div>
      )}
    </div>
  );
}
