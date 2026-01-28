import DashboardWidget from '../DashboardWidget';
import Checklist from '../../Checklist';

export default function PossessionsWidget({
  formData,
  onInputChange,
  canEdit,
  characters,
  character,
  onTransferItem,
  widgetId,
  widthPercent,
  height,
  onResize,
  isEditing
}) {
  return (
    <DashboardWidget title="Possessions" icon="🎒" color="orange" widgetId={widgetId} widthPercent={widthPercent} height={height} onResize={onResize} isEditing={isEditing}>
      <div className="space-y-2">
        {canEdit && characters && characters.length > 1 && (
          <p className="text-xs text-orange-700/70 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            Clic droit pour transférer
          </p>
        )}
        <div className="bg-white/70 rounded-lg p-2">
          <Checklist
            items={formData.possessions}
            onChange={(items) => onInputChange('possessions', items)}
            placeholder="Ajouter..."
            disabled={!canEdit}
            className="min-h-24"
            enableTransfer={canEdit && characters && characters.length > 1}
            onTransferItem={onTransferItem}
            availableCharacters={characters?.filter(c => c.id !== character?.id) || []}
          />
        </div>
      </div>
    </DashboardWidget>
  );
}
