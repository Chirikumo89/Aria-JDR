import DashboardWidget from '../DashboardWidget';
import MoneyManager from '../../MoneyManager';

export default function MoneyWidget({ formData, setFormData, canEdit, characterId, widgetId }) {
  return (
    <DashboardWidget title="Bourse" icon="💰" color="amber" widgetId={widgetId}>
      <MoneyManager
        currencies={{
          crowns: formData.crowns,
          orbs: formData.orbs,
          scepters: formData.scepters,
          kings: formData.kings
        }}
        onChange={(currencies) => {
          setFormData(prev => ({
            ...prev,
            ...currencies
          }));
        }}
        disabled={!canEdit}
        characterId={characterId}
        compact={true}
      />
    </DashboardWidget>
  );
}
