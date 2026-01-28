import DashboardWidget from '../DashboardWidget';

export default function SpecialSkillsWidget({
  formData,
  getSpecialSkill,
  onSpecialSkillChange,
  canEdit,
  widgetId
}) {
  return (
    <DashboardWidget title="Compétences spéciales" icon="⭐" color="green" widgetId={widgetId}>
      <div className="space-y-1.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(index => {
          const skill = getSpecialSkill(index);
          return (
            <div key={index} className="flex items-center gap-1.5 p-1.5 bg-white/90 rounded">
              <input
                type="text"
                value={skill.name}
                onChange={(e) => onSpecialSkillChange(index, 'name', e.target.value)}
                className="flex-1 p-1.5 border border-green-300 bg-white text-green-900 placeholder-green-600 rounded text-xs focus:border-green-500 transition-colors"
                disabled={!canEdit}
                placeholder={`Compétence ${index}`}
              />
              <input
                type="number"
                value={skill.percentage}
                onChange={(e) => onSpecialSkillChange(index, 'percentage', e.target.value)}
                className="w-12 p-1.5 border border-green-300 bg-white text-green-900 text-center rounded text-xs focus:border-green-500 transition-colors font-semibold"
                disabled={!canEdit}
                placeholder="0"
              />
              <span className="text-xs text-green-700 font-medium">%</span>
            </div>
          );
        })}
      </div>
    </DashboardWidget>
  );
}
