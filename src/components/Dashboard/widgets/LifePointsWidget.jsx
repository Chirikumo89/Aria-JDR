import DashboardWidget from '../DashboardWidget';
import LifePointsManager from '../../LifePointsManager';

export default function LifePointsWidget({ formData, setFormData, canEdit, characterId, widgetId, widthPercent, height, onResize, isEditing }) {
  return (
    <DashboardWidget title="Points de vie" icon="❤️‍🩹" color="red" widgetId={widgetId} widthPercent={widthPercent} height={height} onResize={onResize} isEditing={isEditing}>
      <LifePointsManager
        lifePoints={formData.lifePoints}
        currentLifePoints={formData.currentLifePoints}
        onChange={(lifePointsData) => {
          setFormData(prev => ({
            ...prev,
            ...lifePointsData
          }));
        }}
        disabled={!canEdit}
        characterId={characterId}
        compact={true}
      />
    </DashboardWidget>
  );
}
