import DashboardWidget from '../DashboardWidget';
import { ArmorSelector } from '../../WeaponSelector';

export default function CombatWidget({ formData, onInputChange, canEdit, widgetId, isMJ }) {
  return (
    <DashboardWidget title="Combat & Survie" icon="❤️" color="red" widgetId={widgetId}>
      <div className="space-y-3">
        <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
          <span className="text-xl">⬆️</span>
          <label className="text-xs font-semibold text-ink flex-1">PV Max</label>
          <input
            type="number"
            value={formData.lifePoints}
            onChange={(e) => onInputChange('lifePoints', e.target.value)}
            className="w-16 p-1.5 border-2 border-red-300 bg-white text-ink text-center rounded-lg focus:border-red-500 transition-colors font-bold text-sm"
            disabled={!canEdit}
          />
        </div>
        <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
          <span className="text-xl">🩹</span>
          <label className="text-xs font-semibold text-ink flex-1">Blessures</label>
          <input
            type="number"
            value={formData.wounds}
            onChange={(e) => onInputChange('wounds', e.target.value)}
            className="w-16 p-1.5 border-2 border-red-300 bg-white text-ink text-center rounded-lg focus:border-red-500 transition-colors font-bold text-sm"
            disabled={!canEdit}
          />
        </div>
        <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
          <span className="text-xl">🛡️</span>
          <label className="text-xs font-semibold text-ink flex-1">Protection</label>
          <ArmorSelector
            onSelect={(protection) => onInputChange('protection', protection)}
            disabled={!canEdit}
            showPrices={isMJ}
          />
          <input
            type="number"
            value={formData.protection}
            onChange={(e) => onInputChange('protection', e.target.value)}
            className="w-16 p-1.5 border-2 border-red-300 bg-white text-ink text-center rounded-lg focus:border-red-500 transition-colors font-bold text-sm"
            disabled={!canEdit}
          />
        </div>
      </div>
    </DashboardWidget>
  );
}
