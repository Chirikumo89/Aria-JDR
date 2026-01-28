import DashboardWidget from '../DashboardWidget';

export default function TemporarySkillsWidget({
  formData,
  onAddTemporarySkill,
  onUpdateTemporarySkill,
  onRemoveTemporarySkill,
  canEdit,
  widgetId
}) {
  const hasSkills = formData.temporarySkills?.length > 0;

  if (!hasSkills && !canEdit) return null;

  return (
    <DashboardWidget title="Compétences temporaires" icon="✨" color="purple" widgetId={widgetId}>
      <div className="space-y-2">
        {canEdit && (
          <button
            type="button"
            onClick={onAddTemporarySkill}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter une compétence
          </button>
        )}

        {!hasSkills ? (
          <p className="text-xs text-purple-700 text-center py-2">
            Aucune compétence temporaire
          </p>
        ) : (
          <div className="space-y-1.5">
            {formData.temporarySkills?.map((skill) => (
              <div key={skill.id} className="flex items-center gap-1.5 p-1.5 bg-white/90 rounded border border-purple-200">
                <span className="text-purple-500 text-sm">✨</span>
                <input
                  type="text"
                  value={skill.name}
                  onChange={(e) => onUpdateTemporarySkill(skill.id, 'name', e.target.value)}
                  className="flex-1 p-1.5 border border-purple-300 bg-white text-purple-900 placeholder-purple-500 rounded text-xs focus:border-purple-500 transition-colors"
                  disabled={!canEdit}
                  placeholder="Nom"
                />
                <input
                  type="number"
                  value={skill.percentage}
                  onChange={(e) => onUpdateTemporarySkill(skill.id, 'percentage', e.target.value)}
                  className="w-12 p-1.5 border border-purple-300 bg-white text-purple-900 text-center rounded text-xs focus:border-purple-500 transition-colors font-semibold"
                  disabled={!canEdit}
                  placeholder="0"
                />
                <span className="text-xs text-purple-700 font-medium">%</span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => onRemoveTemporarySkill(skill.id)}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardWidget>
  );
}
