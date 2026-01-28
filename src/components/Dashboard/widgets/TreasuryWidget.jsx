import DashboardWidget from '../DashboardWidget';
import CommonTreasury from '../../CommonTreasury';

export default function TreasuryWidget({ character, widgetId, widthPercent, height, onResize, isEditing }) {
  const gameId = character?.gameId || character?.game?.id;

  return (
    <DashboardWidget title="Caisse commune" icon="🏛️" color="emerald" widgetId={widgetId} widthPercent={widthPercent} height={height} onResize={onResize} isEditing={isEditing}>
      {gameId ? (
        <CommonTreasury gameId={gameId} />
      ) : (
        <p className="text-sm text-emerald-700 text-center py-4">
          Aucune partie associée
        </p>
      )}
    </DashboardWidget>
  );
}
