import DashboardWidget from '../DashboardWidget';
import WeaponSelector from '../../WeaponSelector';

export default function WeaponsWidget({ formData, onInputChange, canEdit, widgetId, isMJ, widthPercent, height, onResize, isEditing }) {
  return (
    <DashboardWidget title="Arsenal" icon="⚔️" color="slate" widgetId={widgetId} widthPercent={widthPercent} height={height} onResize={onResize} isEditing={isEditing}>
      <div className="space-y-3">
        {[1, 2, 3].map(num => (
          <div key={num} className="p-2 bg-white/70 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Arme {num}</label>
              <WeaponSelector
                onSelect={(name, damage) => {
                  onInputChange(`weapon${num}`, name);
                  onInputChange(`damage${num}`, damage);
                }}
                disabled={!canEdit}
                showPrices={isMJ}
              />
            </div>
            <input
              type="text"
              value={formData[`weapon${num}`]}
              onChange={(e) => onInputChange(`weapon${num}`, e.target.value)}
              className="w-full p-1.5 border-b-2 border-slate-300 bg-white/80 text-ink placeholder-ink/50 rounded text-sm focus:border-slate-500 transition-colors"
              disabled={!canEdit}
              placeholder="Nom de l'arme"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm">💥</span>
              <input
                type="text"
                value={formData[`damage${num}`]}
                onChange={(e) => onInputChange(`damage${num}`, e.target.value)}
                className="w-16 p-1 border-2 border-slate-300 bg-white text-ink text-center rounded text-sm focus:border-slate-500 transition-colors"
                placeholder="1d6"
                disabled={!canEdit}
              />
            </div>
          </div>
        ))}
      </div>
    </DashboardWidget>
  );
}
