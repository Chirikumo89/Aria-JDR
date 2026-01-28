import DashboardWidget from '../DashboardWidget';

export default function InfoWidget({ formData, onInputChange, canEdit, widgetId, widthPercent, height, onResize, isEditing }) {
  return (
    <DashboardWidget title="Informations" icon="👤" color="amber" widgetId={widgetId} widthPercent={widthPercent} height={height} onResize={onResize} isEditing={isEditing}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-ink mb-1">Fonction</label>
          <input
            type="text"
            value={formData.function}
            onChange={(e) => onInputChange('function', e.target.value)}
            className="w-full p-2 border-b-2 border-amber-300 bg-white/60 text-ink placeholder-ink/50 rounded-lg focus:border-amber-500 transition-colors text-sm"
            placeholder="Ex: Barde (Voleur)"
            disabled={!canEdit}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink mb-1">Nom</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onInputChange('name', e.target.value)}
            className="w-full p-2 border-b-2 border-amber-300 bg-white/60 text-ink placeholder-ink/50 rounded-lg focus:border-amber-500 transition-colors text-sm"
            disabled={!canEdit}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink mb-1">Âge</label>
          <input
            type="number"
            value={formData.age}
            onChange={(e) => onInputChange('age', e.target.value)}
            className="w-full p-2 border-b-2 border-amber-300 bg-white/60 text-ink placeholder-ink/50 rounded-lg focus:border-amber-500 transition-colors text-sm"
            disabled={!canEdit}
          />
        </div>
      </div>
    </DashboardWidget>
  );
}
