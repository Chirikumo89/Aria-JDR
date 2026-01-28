import DashboardWidget from '../DashboardWidget';
import TextareaChecklist from '../../TextareaChecklist';

export default function NotesWidget({ formData, onInputChange, canEdit, widgetId }) {
  return (
    <DashboardWidget title="Notes" icon="📝" color="yellow" widgetId={widgetId}>
      <div className="bg-white/70 rounded-lg p-2">
        <TextareaChecklist
          items={formData.notes}
          onChange={(items) => onInputChange('notes', items)}
          placeholder="Ajouter une note..."
          disabled={!canEdit}
          className="min-h-24"
        />
      </div>
    </DashboardWidget>
  );
}
