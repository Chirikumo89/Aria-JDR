import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { apiService } from '../services/api';
import CharacterSheet from '../components/CharacterSheet';

export default function CharacterSheetPage() {
  const { characterId } = useParams();
  const navigate = useNavigate();
  const { characters, updateCharacter } = useGame();
  const { user } = useAuth();
  const { canViewCharacter, canEditCharacter } = usePermissions();
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadCharacter = async () => {
      try {
        setLoading(true);
        
        // D'abord, essayer de trouver le personnage dans le contexte
        if (characters.length > 0) {
          const foundCharacter = characters.find(c => c.id === characterId);
          if (foundCharacter) {
            setCharacter(foundCharacter);
            setLoading(false);
            return;
          }
        }
        
        // Si pas trouvé dans le contexte, charger depuis l'API
        const characterData = await apiService.getCharacter(characterId);
        setCharacter(characterData);
      } catch (error) {
        console.error('Erreur lors du chargement du personnage:', error);
        navigate('/games');
      } finally {
        setLoading(false);
      }
    };

    if (characterId) {
      loadCharacter();
    }
  }, [characterId, characters, navigate]);

  const handleSave = async (formData) => {
    if (!character) return;

    try {
      setSaving(true);
      
      // Préparer les données pour l'API
      const characterData = {
        name: formData.name,
        function: formData.function,
        age: formData.age ? parseInt(formData.age) : null,
        lifePoints: formData.lifePoints ? parseInt(formData.lifePoints) : null,
        wounds: formData.wounds ? parseInt(formData.wounds) : null,
        protection: formData.protection ? parseInt(formData.protection) : null,
        weapon1: formData.weapon1,
        damage1: formData.damage1,
        weapon2: formData.weapon2,
        damage2: formData.damage2,
        weapon3: formData.weapon3,
        damage3: formData.damage3,
        strength: formData.strength ? parseInt(formData.strength) : null,
        dexterity: formData.dexterity ? parseInt(formData.dexterity) : null,
        endurance: formData.endurance ? parseInt(formData.endurance) : null,
        intelligence: formData.intelligence ? parseInt(formData.intelligence) : null,
        charisma: formData.charisma ? parseInt(formData.charisma) : null,
        awesomeBecause: formData.awesomeBecause,
        societyProblems: formData.societyProblems,
        skills: formData.skills,
        specialSkills: formData.specialSkills,
        possessions: formData.possessions,
        notes: formData.notes
      };

      // Mettre à jour le personnage
      await updateCharacter(character.id, characterData);
      
      // Mettre à jour l'état local
      setCharacter(prev => ({
        ...prev,
        ...characterData
      }));

      if (window.notificationSystem) {
        window.notificationSystem.success('Personnage sauvegardé avec succès !');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      if (window.notificationSystem) {
        window.notificationSystem.error('Erreur lors de la sauvegarde du personnage');
      }
    } finally {
      setSaving(false);
    }
  };

  const canEdit = character && canEditCharacter(character);
  const canView = character && canViewCharacter(character);

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl text-primary mb-4">Chargement...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl text-primary mb-4">Personnage non trouvé</div>
          <button
            onClick={() => navigate('/games')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retour aux parties
          </button>
        </div>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl text-red-500 mb-4">Accès refusé</div>
          <p className="text-secondary mb-4">Vous n'avez pas les permissions nécessaires pour voir cette fiche.</p>
          <button
            onClick={() => navigate('/games')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retour aux parties
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Fiche de personnage
          </h1>
          <p className="text-secondary">
            {character.name} - {character.playerName}
          </p>
          {canView && !canEdit && (
            <p className="text-amber-600 mt-2">
              👁️ Mode lecture seule - Vous ne pouvez pas modifier ce personnage
            </p>
          )}
          {canEdit && (
            <p className="text-green-600 mt-2">
              ✏️ Mode édition - Sauvegarde automatique activée
            </p>
          )}
        </div>

        {/* Fiche de personnage */}
        <CharacterSheet
          character={character}
          onSave={canEdit ? handleSave : null}
          isEditable={canEdit}
        />

        {/* Actions */}
        <div className="mt-8 text-center space-x-4">
          <button
            onClick={() => navigate('/games')}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
          >
            Retour aux parties
          </button>
          {canEdit && (
            <button
              onClick={() => {
                const form = document.querySelector('.character-sheet');
                if (form) {
                  const saveButton = form.querySelector('button[onclick]');
                  if (saveButton) saveButton.click();
                }
              }}
              disabled={saving}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition-colors duration-200"
            >
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
