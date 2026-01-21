import { useState, useEffect, useMemo } from 'react';
import { useAutoSave } from '../hooks/useAutoSave';
import { usePermissions } from '../hooks/usePermissions';
import Checklist from './Checklist';
import TextareaChecklist from './TextareaChecklist';
import CharacterCards from './Cards/CharacterCards';
import MoneyManager from './MoneyManager';
import LifePointsManager from './LifePointsManager';
import CommonTreasury from './CommonTreasury';
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
    currentLifePoints: character?.currentLifePoints ?? character?.lifePoints ?? 0,
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
    notes: migrateChecklistData(character?.notes),
    // Système monétaire
    crowns: character?.crowns || 0,
    orbs: character?.orbs || 0,
    scepters: character?.scepters || 0,
    kings: character?.kings || 0
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
            notes: migrateChecklistData(data.notes),
            // S'assurer que les champs monétaires sont inclus
            crowns: data.crowns || 0,
            orbs: data.orbs || 0,
            scepters: data.scepters || 0,
            kings: data.kings || 0,
            // S'assurer que les PV actuels sont inclus
            currentLifePoints: data.currentLifePoints ?? data.lifePoints ?? 0
          };
          console.log('💾 CharacterSheet: About to save data:', normalizedData);
          console.log('💾 CharacterSheet: currentLifePoints being saved:', normalizedData.currentLifePoints);
          await onSave(normalizedData);
          console.log('✅ Auto-save successful for character:', character?.name);
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
        currentLifePoints: character.currentLifePoints ?? character.lifePoints ?? 0,
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
        notes: migrateChecklistData(character.notes),
        // Système monétaire
        crowns: character.crowns || 0,
        orbs: character.orbs || 0,
        scepters: character.scepters || 0,
        kings: character.kings || 0
      });
    }
  }, [character]);

  return (
    <div className="character-sheet bg-parchment text-ink max-w-4xl mx-auto p-8 rounded-lg shadow-lg">
      {/* Header moderne */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full blur-xl opacity-40"></div>
            <div className="relative text-5xl">👑</div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-700 to-amber-900 bg-clip-text text-transparent">
            AVENTURIER
          </h1>
          <h2 className="text-2xl font-semibold text-ink/80">
            VIVRE OU SURVIVRE
          </h2>
        </div>
        {/* Indicateurs modernes */}
        <div className="flex flex-wrap justify-center gap-3">
          {canEdit && (
            <div className="px-4 py-2 rounded-xl backdrop-blur-sm border transition-all duration-300">
              {isSaving ? (
                <span className="text-amber-600 flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sauvegarde en cours...
                </span>
              ) : (
                <span className="text-green-700 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Sauvegarde automatique
                </span>
              )}
            </div>
          )}
          {!canView && (
            <div className="px-4 py-2 rounded-xl bg-red-100/80 border border-red-300 text-red-700 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Accès refusé
            </div>
          )}
          {canView && !canEdit && (
            <div className="px-4 py-2 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-700 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Mode lecture seule
            </div>
          )}
        </div>
      </div>

      {/* Informations de base et combat */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Informations de base */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50/80 to-amber-100/60 border-2 border-amber-200/50 shadow-md">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 bg-amber-800 text-white px-4 py-2 rounded-xl shadow-md -mx-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Informations
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">Fonction</label>
              <input
                type="text"
                value={formData.function}
                onChange={(e) => handleInputChange('function', e.target.value)}
                className="w-full p-3 border-b-2 border-amber-300 bg-white/60 text-ink placeholder-ink/50 rounded-lg focus:border-amber-500 transition-colors"
                placeholder="Ex: Barde (Voleur)"
                disabled={!canEdit}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">Nom</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full p-3 border-b-2 border-amber-300 bg-white/60 text-ink placeholder-ink/50 rounded-lg focus:border-amber-500 transition-colors"
                disabled={!canEdit}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">Âge</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                className="w-full p-3 border-b-2 border-amber-300 bg-white/60 text-ink placeholder-ink/50 rounded-lg focus:border-amber-500 transition-colors"
                disabled={!canEdit}
              />
            </div>
          </div>
        </div>

        {/* Points de vie et combat */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-red-50/80 to-red-100/60 border-2 border-red-200/50 shadow-md">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 bg-red-800 text-white px-4 py-2 rounded-xl shadow-md -mx-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Combat & Survie
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
              <span className="text-2xl">⬆️</span>
              <label className="text-sm font-semibold text-ink flex-1">Points de vie</label>
              <input
                type="number"
                value={formData.lifePoints}
                onChange={(e) => handleInputChange('lifePoints', e.target.value)}
                className="w-20 p-2 border-2 border-red-300 bg-white text-ink text-center rounded-lg focus:border-red-500 transition-colors font-bold"
                disabled={!canEdit}
              />
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
              <span className="text-2xl">🌀</span>
              <label className="text-sm font-semibold text-ink flex-1">Blessures</label>
              <input
                type="number"
                value={formData.wounds}
                onChange={(e) => handleInputChange('wounds', e.target.value)}
                className="w-20 p-2 border-2 border-red-300 bg-white text-ink text-center rounded-lg focus:border-red-500 transition-colors font-bold"
                disabled={!canEdit}
              />
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
              <span className="text-2xl">🛡️</span>
              <label className="text-sm font-semibold text-ink flex-1">Protection</label>
              <input
                type="number"
                value={formData.protection}
                onChange={(e) => handleInputChange('protection', e.target.value)}
                className="w-20 p-2 border-2 border-red-300 bg-white text-ink text-center rounded-lg focus:border-red-500 transition-colors font-bold"
                disabled={!canEdit}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Armes */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-slate-50/80 to-slate-100/60 border-2 border-slate-200/50 shadow-md">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-xl shadow-md -mx-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
          </svg>
          Arsenal
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(num => (
            <div key={num} className="p-4 bg-white/70 rounded-xl border border-slate-300/50 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Arme {num}</label>
                <input
                  type="text"
                  value={formData[`weapon${num}`]}
                  onChange={(e) => handleInputChange(`weapon${num}`, e.target.value)}
                  className="w-full p-2 border-b-2 border-slate-300 bg-white/80 text-ink placeholder-ink/50 rounded-lg focus:border-slate-500 transition-colors"
                  disabled={!canEdit}
                  placeholder="Nom de l'arme"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">💥</span>
                <label className="text-xs font-semibold text-slate-700">Dégâts</label>
                <input
                  type="text"
                  value={formData[`damage${num}`]}
                  onChange={(e) => handleInputChange(`damage${num}`, e.target.value)}
                  className="w-20 p-2 border-2 border-slate-300 bg-white text-ink text-center rounded-lg focus:border-slate-500 transition-colors"
                  placeholder="1d4"
                  disabled={!canEdit}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Caractéristiques et déclarations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Caractéristiques */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50/80 to-blue-100/60 border-2 border-blue-200/50 shadow-md">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 bg-blue-800 text-white px-4 py-2 rounded-xl shadow-md -mx-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Caractéristiques
          </h3>
          <div className="space-y-3">
            {[
              { key: 'strength', label: 'Force', icon: '💪' },
              { key: 'dexterity', label: 'Dextérité', icon: '🤸' },
              { key: 'endurance', label: 'Endurance', icon: '🏃' },
              { key: 'intelligence', label: 'Intelligence', icon: '🧠' },
              { key: 'charisma', label: 'Charisme', icon: '✨' }
            ].map(({ key, label, icon }) => (
              <div key={key} className="flex items-center justify-between p-3 bg-white/70 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{icon}</span>
                  <label className="text-sm font-semibold text-ink">{label}</label>
                </div>
                <input
                  type="number"
                  value={formData[key]}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  className="w-20 p-2 border-2 border-blue-300 bg-white text-ink text-center rounded-lg focus:border-blue-500 transition-colors font-bold"
                  disabled={!canEdit}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Déclarations personnelles */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-50/80 to-purple-100/60 border-2 border-purple-200/50 shadow-md">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 bg-purple-800 text-white px-4 py-2 rounded-xl shadow-md -mx-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Personnalité
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-purple-900 mb-2">Je suis génial·e parce que...</label>
              <textarea
                value={formData.awesomeBecause}
                onChange={(e) => handleInputChange('awesomeBecause', e.target.value)}
                className="w-full p-3 border-2 border-purple-300 bg-white/70 text-ink placeholder-ink/50 rounded-lg focus:border-purple-500 transition-colors"
                rows="3"
                disabled={!canEdit}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-purple-900 mb-2">Mais la société a des problèmes avec moi parce que...</label>
              <textarea
                value={formData.societyProblems}
                onChange={(e) => handleInputChange('societyProblems', e.target.value)}
                className="w-full p-3 border-2 border-purple-300 bg-white/70 text-ink placeholder-ink/50 rounded-lg focus:border-purple-500 transition-colors"
                rows="3"
                disabled={!canEdit}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Compétences */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-green-50/80 to-green-100/60 border-2 border-green-200/50 shadow-md">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 bg-green-800 text-white px-4 py-2 rounded-xl shadow-md -mx-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          Compétences
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-4 bg-white/70 rounded-xl">
            <h4 className="text-sm font-bold text-green-900 mb-3">Compétences de base</h4>
            <div className="space-y-2">
              {SKILLS.map((skill, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-white/80 rounded-lg hover:bg-green-50/50 transition-colors">
                  <span className="text-xs text-ink/80 flex-1 font-medium">{skill.name}</span>
                  <span className="text-xs text-ink/60 w-16 text-center bg-green-100/60 px-2 py-1 rounded">{skill.link}</span>
                  <input
                    type="number"
                    value={formData.skills[skill.name] || ''}
                    onChange={(e) => handleSkillChange(skill.name, e.target.value)}
                    className="w-16 p-1 border-2 border-green-300 bg-white text-ink text-center rounded-lg focus:border-green-500 transition-colors"
                    disabled={!canEdit}
                  />
                  <span className="text-xs text-ink/60">%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 bg-white/70 rounded-xl">
            <h4 className="text-sm font-bold text-green-900 mb-3">Compétences spéciales</h4>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(index => (
                <div key={index} className="flex items-center gap-2 p-2 bg-white/80 rounded-lg">
                  <input
                    type="text"
                    value={formData.specialSkills[index] || ''}
                    onChange={(e) => handleSpecialSkillChange(index, e.target.value)}
                    className="flex-1 p-2 border-2 border-green-300 bg-white text-ink placeholder-ink/50 rounded-lg focus:border-green-500 transition-colors"
                    disabled={!canEdit}
                    placeholder={`Compétence ${index}`}
                  />
                  <span className="text-xs text-ink/60">/</span>
                  <input
                    type="number"
                    className="w-16 p-2 border-2 border-green-300 bg-white text-ink text-center rounded-lg focus:border-green-500 transition-colors"
                    disabled={!canEdit}
                  />
                  <span className="text-xs text-ink/60">%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Possessions et notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-50/80 to-orange-100/60 border-2 border-orange-200/50 shadow-md">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 bg-orange-800 text-white px-4 py-2 rounded-xl shadow-md -mx-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Possessions
          </h3>
          <div className="bg-white/70 rounded-xl p-4">
            <Checklist
              items={formData.possessions}
              onChange={(items) => handleInputChange('possessions', items)}
              placeholder="Ajouter une possession..."
              disabled={!canEdit}
              className="min-h-32"
            />
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-gradient-to-br from-yellow-50/80 to-yellow-100/60 border-2 border-yellow-200/50 shadow-md">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 bg-yellow-800 text-white px-4 py-2 rounded-xl shadow-md -mx-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Notes
          </h3>
          <div className="bg-white/70 rounded-xl p-4">
            <TextareaChecklist
              items={formData.notes}
              onChange={(items) => handleInputChange('notes', items)}
              placeholder="Ajouter une note..."
              disabled={!canEdit}
              className="min-h-32"
            />
          </div>
        </div>
      </div>

      {/* Système monétaire */}
      <div className="mb-8">
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
          characterId={character?.id}
        />
      </div>

      {/* Caisse commune */}
      {(character?.gameId || character?.game?.id) && (
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-emerald-100/60 border-2 border-emerald-200/50 shadow-md">
          <CommonTreasury 
            gameId={character.gameId || character.game?.id}
          />
        </div>
      )}

      {/* Gestion des Points de Vie */}
      <div className="mb-8">
        <LifePointsManager
          lifePoints={formData.lifePoints}
          currentLifePoints={formData.currentLifePoints}
          onChange={(lifePointsData) => {
            console.log('📥 CharacterSheet: Received lifePointsData:', lifePointsData);
            setFormData(prev => {
              const newData = {
                ...prev,
                ...lifePointsData
              };
              console.log('📝 CharacterSheet: Updated formData. currentLifePoints:', newData.currentLifePoints);
              return newData;
            });
          }}
          disabled={!canEdit}
          characterId={character?.id}
        />
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
      <div className="text-center mt-8 mb-6">
        <div className="flex justify-center mb-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full blur-2xl opacity-30"></div>
            <div className="relative text-6xl">👑</div>
          </div>
        </div>
        <div className="text-3xl font-bold bg-gradient-to-r from-amber-700 to-amber-900 bg-clip-text text-transparent">
          ARIA
        </div>
      </div>

      {/* Boutons d'action */}
      {canEdit && onSave && (
        <div className="mt-6 text-center">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="group relative px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-2xl font-semibold text-lg shadow-lg hover:shadow-amber-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="relative flex items-center justify-center gap-2">
              {isSaving ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sauvegarde...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Sauvegarder maintenant
                </>
              )}
            </span>
          </button>
          <div className="text-xs text-ink/60 mt-3 px-4">
            Les modifications sont sauvegardées automatiquement après 2 secondes d'inactivité
          </div>
        </div>
      )}

      {/* Message si pas d'accès */}
      {!canView && (
        <div className="mt-8">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-red-100 to-red-200 border-2 border-red-300 shadow-lg">
            <div className="flex items-center justify-center gap-3 mb-3">
              <svg className="w-8 h-8 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-xl font-bold text-red-800">Accès refusé</h3>
            </div>
            <p className="text-center text-red-700">Vous n'avez pas les permissions nécessaires pour voir cette fiche de personnage.</p>
          </div>
        </div>
      )}
    </div>
  );
}
