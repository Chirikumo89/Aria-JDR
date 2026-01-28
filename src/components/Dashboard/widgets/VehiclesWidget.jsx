import DashboardWidget from '../DashboardWidget';
import VehicleInventory from '../../VehicleInventory';

export default function VehiclesWidget({ character, canEdit, widgetId }) {
  const gameId = character?.gameId || character?.game?.id;

  return (
    <DashboardWidget title="Véhicules & Cales" icon="🚢" color="cyan" widgetId={widgetId}>
      {gameId ? (
        <VehicleInventory gameId={gameId} disabled={!canEdit} />
      ) : (
        <p className="text-sm text-cyan-700 text-center py-4">
          Aucune partie associée
        </p>
      )}
    </DashboardWidget>
  );
}
