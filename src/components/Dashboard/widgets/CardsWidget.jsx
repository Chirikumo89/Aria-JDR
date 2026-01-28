import DashboardWidget from '../DashboardWidget';
import CharacterCards from '../../Cards/CharacterCards';

export default function CardsWidget({ character, canEdit, widgetId }) {
  return (
    <DashboardWidget title="Cartes" icon="🃏" color="amber" widgetId={widgetId}>
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
