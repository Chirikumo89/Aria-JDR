import DashboardWidget from '../DashboardWidget';
import LifePointsManager from '../../LifePointsManager';

export default function LifePointsWidget({ formData, setFormData, canEdit, characterId, widgetId }) {
  return (
    <DashboardWidget title="Points de vie" icon="❤️‍🩹" color="red" widgetId={widgetId}>
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
