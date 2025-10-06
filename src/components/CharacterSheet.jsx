import { useState, useEffect, useMemo } from 'react';
import { useAutoSave } from '../hooks/useAutoSave';
import { usePermissions } from '../hooks/usePermissions';
import Checklist from './Checklist';
import TextareaChecklist from './TextareaChecklist';
import CharacterCards from './Cards/CharacterCards';
import { migrateChecklistData } from '../utils/migrateChecklistData';

const SKILLS = [
  { name: "Artisanat, construire", link: "DEX/INT" },
  { name: "Combat rapproché", link: "FOR/DEX" },
  { name: "Combat à distance", link: "DEX/INT" },
  { name: "Connaissance de la nature", link: "INT/END" },
  { name: "Connaissance des secrets", link: "INT/CHA" },
  { name: "Courir, sauter", link: "FOR/END" },
  { name: "Discrétion", link: "DEX/INT" },
  { name: "Droit", link: "INT/CHA" },
  { name: "Esquiver", link: "DEX/END" },
  { name: "Intimider", link: "FOR/CHA" },
  { name: "Lire, écrire", link: "INT/CHA" },
  { name: "Mentir, convaincre", link: "INT/CHA" },
  { name: "Perception", link: "INT/END" },
  { name: "Piloter", link: "DEX/INT" },
  { name: "Psychologie", link: "INT/CHA" },
  { name: "Réflexes", link: "DEX/END" },
  { name: "Serrures et pièges", link: "DEX/INT" },
  { name: "Soigner", link: "INT/END" },
  { name: "Survie", link: "FOR/INT" },
  { name: "Voler", link: "DEX/INT" }
];

export default function CharacterSheet({ character, onSave, isEditable = true }) {
  const { canEditCharacter, canViewCharacter } = usePermissions();


  const [formData, setFormData] = useState(() => ({
    name: String(character?.name || ''),
    function: String(character?.function || ''),
    age: character?.age || '',
    lifePoints: character?.lifePoints || '',
    wounds: character?.wounds || '',
    protection: character?.protection || '',
    weapon1: String(character?.weapon1 || ''),
    damage1: String(character?.damage1 || ''),
    weapon2: String(character?.weapon2 || ''),
    damage2: String(character?.damage2 || ''),
    weapon3: String(character?.weapon3 || ''),
    damage3: String(character?.damage3 || ''),
    strength: character?.strength || '',
    dexterity: character?.dexterity || '',
    endurance: character?.endurance || '',
    intelligence: character?.intelligence || '',
    charisma: character?.charisma || '',
    awesomeBecause: String(character?.awesomeBecause || ''),
    societyProblems: String(character?.societyProblems || ''),
    skills: character?.skills || {},
    specialSkills: character?.specialSkills || {},
    possessions: migrateChecklistData(character?.possessions),
    notes: migrateChecklistData(character?.notes)
  }));

  // Vérifier les permissions
  const canEdit = isEditable && canEditCharacter(character);
  const canView = canViewCharacter(character);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSkillChange = (skillName, value) => {
    setFormData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [skillName]: value
      }
    }));
  };

  const handleSpecialSkillChange = (index, value) => {
    setFormData(prev => ({
      ...prev,
      specialSkills: {
        ...prev.specialSkills,
        [index]: value
      }
    }));
  };

  // Fonction de sauvegarde pour l'auto-save (mémorisée)
  const handleAutoSave = useMemo(() => {
    return async (data) => {
      if (onSave && canEdit) {
        try {
          // Normaliser les données de checklist avant sauvegarde
          const normalizedData = {
            ...data,
            possessions: migrateChecklistData(data.possessions),
            notes: migrateChecklistData(data.notes)
          };
          await onSave(normalizedData);
          console.log('Auto-save successful for character:', character?.name);
        } catch (error) {
          console.error('Auto-save failed:', error);
          throw error;
        }
      }
    };
  }, [onSave, canEdit, character?.name]);

  // Hook de sauvegarde automatique
  const { forceSave, isSaving } = useAutoSave(
    handleAutoSave,
    formData,
    5000, // 5 secondes de délai pour éviter les sauvegardes trop fréquentes
    canEdit // Seulement si l'utilisateur peut éditer
  );

  const handleSave = () => {
    if (onSave && canEdit) {
      forceSave();
    }
  };

  // Mettre à jour formData quand character change
  useEffect(() => {
    if (character) {
      setFormData({
        name: String(character.name || ''),
        function: String(character.function || ''),
        age: character.age || '',
        lifePoints: character.lifePoints || '',
        wounds: character.wounds || '',
        protection: character.protection || '',
        weapon1: String(character.weapon1 || ''),
        damage1: String(character.damage1 || ''),
        weapon2: String(character.weapon2 || ''),
        damage2: String(character.damage2 || ''),
        weapon3: String(character.weapon3 || ''),
        damage3: String(character.damage3 || ''),
        strength: character.strength || '',
        dexterity: character.dexterity || '',
        endurance: character.endurance || '',
        intelligence: character.intelligence || '',
        charisma: character.charisma || '',
        awesomeBecause: String(character.awesomeBecause || ''),
        societyProblems: String(character.societyProblems || ''),
        skills: character.skills || {},
        specialSkills: character.specialSkills || {},
        possessions: migrateChecklistData(character.possessions),
        notes: migrateChecklistData(character.notes)
      });
    }
  }, [character]);

  return (
    <div className="character-sheet bg-parchment text-ink max-w-4xl mx-auto p-8 rounded-lg shadow-lg">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="crown-icon text-4xl mb-4">👑</div>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-ink">AVENTURIER</h1>
          <h2 className="text-2xl font-bold text-ink">VIVRE OU SURVIVRE</h2>
        </div>
        {/* Indicateur de sauvegarde automatique */}
        {canEdit && (
          <div className="text-sm text-ink/70 mb-2">
            {isSaving ? (
              <span className="text-amber-600">💾 Sauvegarde en cours...</span>
            ) : (
              <span className="text-green-600">✓ Sauvegarde automatique activée</span>
            )}
          </div>
        )}
        {/* Indicateur de permissions */}
        {!canView && (
          <div className="text-sm text-red-600 mb-2">
            ⚠️ Vous n'avez pas accès à cette fiche
          </div>
        )}
        {canView && !canEdit && (
          <div className="text-sm text-amber-600 mb-2">
            👁️ Mode lecture seule
          </div>
        )}
      </div>

      {/* Informations de base et combat */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Informations de base */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Fonction:</label>
            <input
              type="text"
              value={formData.function}
              onChange={(e) => handleInputChange('function', e.target.value)}
              className="w-full p-2 border-b-2 border-ink bg-transparent text-ink placeholder-ink/50"
              placeholder="Ex: Barde (Voleur)"
              disabled={!canEdit}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Nom:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full p-2 border-b-2 border-ink bg-transparent text-ink placeholder-ink/50"
              disabled={!canEdit}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Âge:</label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => handleInputChange('age', e.target.value)}
              className="w-full p-2 border-b-2 border-ink bg-transparent text-ink placeholder-ink/50"
              disabled={!canEdit}
            />
          </div>
        </div>

        {/* Points de vie et combat */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⬆️</span>
            <label className="text-sm font-medium text-ink">Points de vie:</label>
            <input
              type="number"
              value={formData.lifePoints}
              onChange={(e) => handleInputChange('lifePoints', e.target.value)}
              className="w-16 p-1 border-b-2 border-ink bg-transparent text-ink text-center"
              disabled={!canEdit}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌀</span>
            <label className="text-sm font-medium text-ink">Blessures:</label>
            <input
              type="number"
              value={formData.wounds}
              onChange={(e) => handleInputChange('wounds', e.target.value)}
              className="w-16 p-1 border-b-2 border-ink bg-transparent text-ink text-center"
              disabled={!canEdit}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <label className="text-sm font-medium text-ink">Protection:</label>
            <input
              type="number"
              value={formData.protection}
              onChange={(e) => handleInputChange('protection', e.target.value)}
              className="w-16 p-1 border-b-2 border-ink bg-transparent text-ink text-center"
              disabled={!canEdit}
            />
          </div>
        </div>
      </div>

      {/* Armes */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-ink mb-4">Armes</h3>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(num => (
            <div key={num} className="space-y-2">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Arme {num}:</label>
                <input
                  type="text"
                  value={formData[`weapon${num}`]}
                  onChange={(e) => handleInputChange(`weapon${num}`, e.target.value)}
                  className="w-full p-2 border-b-2 border-ink bg-transparent text-ink placeholder-ink/50"
                  disabled={!canEdit}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">💥</span>
                <label className="text-sm font-medium text-ink">Dégâts:</label>
                <input
                  type="text"
                  value={formData[`damage${num}`]}
                  onChange={(e) => handleInputChange(`damage${num}`, e.target.value)}
                  className="w-20 p-1 border-b-2 border-ink bg-transparent text-ink text-center"
                  placeholder="1d4"
                  disabled={!canEdit}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Caractéristiques et déclarations */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Caractéristiques */}
        <div>
          <h3 className="text-lg font-bold text-ink mb-4">CARACTÉRISTIQUES</h3>
          <div className="space-y-2">
            {[
              { key: 'strength', label: 'Force:' },
              { key: 'dexterity', label: 'Dextérité:' },
              { key: 'endurance', label: 'Endurance:' },
              { key: 'intelligence', label: 'Intelligence:' },
              { key: 'charisma', label: 'Charisme:' }
            ].map(({ key, label }) => (
              <div key={key} className="flex justify-between items-center">
                <label className="text-sm font-medium text-ink">{label}</label>
                <input
                  type="number"
                  value={formData[key]}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  className="w-16 p-1 border-b-2 border-ink bg-transparent text-ink text-center"
                  disabled={!canEdit}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Déclarations personnelles */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-2">JE SUIS GÉNIAL-E PARCE QUE...</label>
            <textarea
              value={formData.awesomeBecause}
              onChange={(e) => handleInputChange('awesomeBecause', e.target.value)}
              className="w-full p-2 border-2 border-ink bg-transparent text-ink placeholder-ink/50 rounded"
              rows="3"
              disabled={!canEdit}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-2">MAIS LA SOCIÉTÉ A DES PROBLÈMES AVEC MOI PARCE QUE...</label>
            <textarea
              value={formData.societyProblems}
              onChange={(e) => handleInputChange('societyProblems', e.target.value)}
              className="w-full p-2 border-2 border-ink bg-transparent text-ink placeholder-ink/50 rounded"
              rows="3"
              disabled={!canEdit}
            />
          </div>
        </div>
      </div>

      {/* Compétences */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-ink mb-4">COMPÉTENCES</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="space-y-2">
              {SKILLS.map((skill, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-xs text-ink/70 w-32">{skill.name}</span>
                  <span className="text-xs text-ink/70 w-16">{skill.link}</span>
                  <input
                    type="number"
                    value={formData.skills[skill.name] || ''}
                    onChange={(e) => handleSkillChange(skill.name, e.target.value)}
                    className="w-16 p-1 border-b-2 border-ink bg-transparent text-ink text-center"
                    disabled={!canEdit}
                  />
                  <span className="text-xs text-ink/70">%</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-md font-bold text-ink mb-2">COMPÉTENCES SPÉCIALES</h4>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(index => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.specialSkills[index] || ''}
                    onChange={(e) => handleSpecialSkillChange(index, e.target.value)}
                    className="flex-1 p-1 border-b-2 border-ink bg-transparent text-ink placeholder-ink/50"
                    disabled={!canEdit}
                  />
                  <span className="text-xs text-ink/70 w-8">/</span>
                  <input
                    type="number"
                    className="w-16 p-1 border-b-2 border-ink bg-transparent text-ink text-center"
                    disabled={!canEdit}
                  />
                  <span className="text-xs text-ink/70">%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Possessions et notes */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-lg font-bold text-ink mb-4">POSSESSIONS</h3>
          <Checklist
            items={formData.possessions}
            onChange={(items) => handleInputChange('possessions', items)}
            placeholder="Ajouter une possession..."
            disabled={!canEdit}
            className="min-h-32"
          />
        </div>
        <div>
          <h3 className="text-lg font-bold text-ink mb-4">NOTES</h3>
          <TextareaChecklist
            items={formData.notes}
            onChange={(items) => handleInputChange('notes', items)}
            placeholder="Ajouter une note..."
            disabled={!canEdit}
            className="min-h-32"
          />
        </div>
      </div>

      {/* Cartes du personnage */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-ink mb-4">CARTES</h3>
        <CharacterCards
          character={character}
          onRemoveCard={canEdit ? (cardId, characterId) => {
            // Cette fonction sera implémentée dans le contexte parent
            console.log('Retirer carte', cardId, 'du personnage', characterId);
          } : null}
          canEdit={canEdit}
        />
      </div>

      {/* Footer avec logo ARIA */}
      <div className="text-center">
        <div className="text-6xl mb-2">👑</div>
        <div className="text-2xl font-bold text-ink">ARIA</div>
      </div>

      {/* Boutons d'action */}
      {canEdit && onSave && (
        <div className="mt-8 text-center space-x-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-400 transition-colors duration-200"
          >
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder maintenant'}
          </button>
          <div className="text-xs text-ink/60 mt-2">
            Les modifications sont sauvegardées automatiquement après 2 secondes d'inactivité
          </div>
        </div>
      )}
      
      {/* Message si pas d'accès */}
      {!canView && (
        <div className="mt-8 text-center">
          <div className="text-red-600 bg-red-100 p-4 rounded-lg border border-red-300">
            <h3 className="font-semibold mb-2">Accès refusé</h3>
            <p>Vous n'avez pas les permissions nécessaires pour voir cette fiche de personnage.</p>
          </div>
        </div>
      )}
    </div>
  );
}
