import DashboardWidget from '../DashboardWidget';

const STATS = [
  { key: 'strength', label: 'Force', icon: '💪' },
  { key: 'dexterity', label: 'Dextérité', icon: '🤸' },
  { key: 'endurance', label: 'Endurance', icon: '🏃' },
  { key: 'intelligence', label: 'Intelligence', icon: '🧠' },
  { key: 'charisma', label: 'Charisme', icon: '✨' }
];

export default function StatsWidget({ formData, onInputChange, canEdit, widgetId, widthPercent, height, onResize, isEditing }) {
  return (
    <DashboardWidget title="Caractéristiques" icon="📊" color="blue" widgetId={widgetId} widthPercent={widthPercent} height={height} onResize={onResize} isEditing={isEditing}>
      <div className="space-y-2">
        {STATS.map(({ key, label, icon }) => (
          <div key={key} className="flex items-center justify-between p-2 bg-white/70 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-lg">{icon}</span>
              <label className="text-xs font-semibold text-ink">{label}</label>
            </div>
            <input
              type="number"
              value={formData[key]}
              onChange={(e) => onInputChange(key, e.target.value)}
              className="w-16 p-1.5 border-2 border-blue-300 bg-white text-ink text-center rounded-lg focus:border-blue-500 transition-colors font-bold text-sm"
              disabled={!canEdit}
            />
          </div>
        ))}
      </div>
    </DashboardWidget>
  );
}
