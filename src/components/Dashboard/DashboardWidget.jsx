import { useState, useRef, useCallback } from 'react';

const MIN_HEIGHT = 80;
const MIN_WIDTH_PERCENT = 15; // Largeur minimum en %
const MAX_WIDTH_PERCENT = 100; // Largeur maximum en %

export default function DashboardWidget({
  title,
  icon,
  children,
  color = 'amber',
  collapsible = true,
  defaultCollapsed = false,
  widgetId,
  widthPercent = 25,
  height = 'auto',
  onResize,
  isEditing = false,
  className = ''
}) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const containerRef = useRef(null);
  const isResizingRef = useRef(false);
  const resizeDirectionRef = useRef(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const startDimensionsRef = useRef({ width: 0, height: 0, widthPercent: 25 });
  const parentWidthRef = useRef(0);

  const handleMouseDown = useCallback((e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingRef.current = true;
    resizeDirectionRef.current = direction;
    startPosRef.current = { x: e.clientX, y: e.clientY };

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      // Remonter au conteneur flex (grand-parent: widget -> wrapper div -> flex container)
      const flexContainer = containerRef.current.parentElement?.parentElement;
      const flexRect = flexContainer?.getBoundingClientRect();
      // Utiliser la largeur du flex container moins le padding (32px = p-4 * 2)
      parentWidthRef.current = (flexRect?.width || window.innerWidth) - 32;
      startDimensionsRef.current = {
        width: rect.width,
        height: rect.height,
        widthPercent: widthPercent
      };
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [widthPercent]);

  const handleMouseMove = useCallback((e) => {
    if (!isResizingRef.current || !onResize) return;

    const deltaX = e.clientX - startPosRef.current.x;
    const deltaY = e.clientY - startPosRef.current.y;
    const direction = resizeDirectionRef.current;

    let newWidthPercent = startDimensionsRef.current.widthPercent;
    let newHeight = typeof height === 'number' ? height : null;

    // Redimensionnement horizontal -> change la largeur en %
    if (direction.includes('e') || direction.includes('w')) {
      const delta = direction.includes('e') ? deltaX : -deltaX;
      // Calculer la nouvelle largeur cible en pixels
      const newWidthPx = startDimensionsRef.current.width + delta;
      // Convertir en pourcentage (en tenant compte du gap de 16px)
      newWidthPercent = ((newWidthPx + 16) / parentWidthRef.current) * 100;
      // Limiter aux bornes
      newWidthPercent = Math.max(
        MIN_WIDTH_PERCENT,
        Math.min(MAX_WIDTH_PERCENT, newWidthPercent)
      );
      // Arrondir à 1% près pour éviter les valeurs trop précises
      newWidthPercent = Math.round(newWidthPercent);
    }

    // Redimensionnement vertical -> change la hauteur
    if (direction.includes('s') || direction.includes('n')) {
      const delta = direction.includes('s') ? deltaY : -deltaY;
      newHeight = Math.max(MIN_HEIGHT, Math.round(startDimensionsRef.current.height + delta));
    }

    onResize(widgetId, { widthPercent: newWidthPercent, height: newHeight });
  }, [onResize, widgetId, height]);

  const handleMouseUp = useCallback(() => {
    isResizingRef.current = false;
    resizeDirectionRef.current = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const resetSize = (e) => {
    e.stopPropagation();
    if (onResize) {
      onResize(widgetId, { widthPercent: 25, height: null });
    }
  };

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

  const containerStyle = {
    height: typeof height === 'number' ? `${height}px` : undefined,
    minHeight: MIN_HEIGHT
  };

  const hasCustomSize = widthPercent !== 25 || (typeof height === 'number');

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      className={`relative flex flex-col rounded-xl bg-gradient-to-br ${colors.bg} border-2 ${colors.border} shadow-md overflow-hidden ${className}`}
    >
      {/* Header - zone de drag */}
      <div
        className={`widget-drag-handle flex items-center justify-between ${colors.header} text-white px-3 py-2 cursor-move select-none`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {icon && <span className="text-lg flex-shrink-0">{icon}</span>}
          <h3 className="font-bold text-sm truncate">{title}</h3>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Indicateur de largeur si personnalisée - uniquement en mode édition */}
          {isEditing && widthPercent !== 25 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/20">
              {Math.round(widthPercent)}%
            </span>
          )}
          {/* Bouton reset taille si personnalisée - uniquement en mode édition */}
          {isEditing && hasCustomSize && (
            <button
              type="button"
              onClick={resetSize}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${colors.headerHover} transition-colors bg-white/20`}
              title="Réinitialiser la taille"
            >
              ↺
            </button>
          )}
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
        <div className="flex-1 overflow-auto p-3">
          {children}
        </div>
      )}

      {/* Poignées de redimensionnement - uniquement en mode édition */}
      {isEditing && (
        <>
          {/* Gauche */}
          <div
            onMouseDown={(e) => handleMouseDown(e, 'w')}
            className="absolute top-0 left-0 w-2 h-full cursor-ew-resize hover:bg-amber-400/30 transition-colors z-10"
          />
          {/* Droite */}
          <div
            onMouseDown={(e) => handleMouseDown(e, 'e')}
            className="absolute top-0 right-0 w-2 h-full cursor-ew-resize hover:bg-amber-400/30 transition-colors z-10"
          />
          {/* Bas */}
          <div
            onMouseDown={(e) => handleMouseDown(e, 's')}
            className="absolute bottom-0 left-2 right-2 h-2 cursor-ns-resize hover:bg-amber-400/30 transition-colors z-10"
          />
          {/* Coin bas-gauche */}
          <div
            onMouseDown={(e) => handleMouseDown(e, 'sw')}
            className="absolute bottom-0 left-0 w-4 h-4 cursor-nesw-resize hover:bg-amber-400/50 transition-colors z-20"
          />
          {/* Coin bas-droite */}
          <div
            onMouseDown={(e) => handleMouseDown(e, 'se')}
            className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize hover:bg-amber-400/50 transition-colors z-20"
          />
        </>
      )}
    </div>
  );
}
