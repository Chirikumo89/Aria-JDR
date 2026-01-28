import DashboardWidget from '../DashboardWidget';
import CharacterCards from '../../Cards/CharacterCards';

export default function CardsWidget({ character, canEdit, widgetId, widthPercent, height, onResize, isEditing }) {
  return (
    <DashboardWidget title="Cartes" icon="🃏" color="amber" widgetId={widgetId} widthPercent={widthPercent} height={height} onResize={onResize} isEditing={isEditing}>
      <CharacterCards
        character={character}
        onRemoveCard={canEdit ? (cardId) => {
          console.log('Retirer carte', cardId);
        } : null}
        canEdit={canEdit}
      />
    </DashboardWidget>
  );
}
