import DashboardWidget from '../DashboardWidget';

export default function PersonalityWidget({ formData, onInputChange, canEdit, widgetId, widthPercent, height, onResize, isEditing }) {
  return (
    <DashboardWidget title="Personnalité" icon="💬" color="purple" widgetId={widgetId} widthPercent={widthPercent} height={height} onResize={onResize} isEditing={isEditing}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-purple-900 mb-1">
            Je suis génial·e parce que...
          </label>
          <textarea
            value={formData.awesomeBecause}
            onChange={(e) => onInputChange('awesomeBecause', e.target.value)}
            className="w-full p-2 border-2 border-purple-300 bg-white/70 text-ink placeholder-ink/50 rounded-lg focus:border-purple-500 transition-colors text-sm resize-none"
            rows="2"
            disabled={!canEdit}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-purple-900 mb-1">
            Mais la société a des problèmes avec moi parce que...
          </label>
          <textarea
            value={formData.societyProblems}
            onChange={(e) => onInputChange('societyProblems', e.target.value)}
            className="w-full p-2 border-2 border-purple-300 bg-white/70 text-ink placeholder-ink/50 rounded-lg focus:border-purple-500 transition-colors text-sm resize-none"
            rows="2"
            disabled={!canEdit}
          />
        </div>
      </div>
    </DashboardWidget>
  );
}
