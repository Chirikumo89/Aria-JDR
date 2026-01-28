import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAutoSave } from '../../hooks/useAutoSave';
import { usePermissions } from '../../hooks/usePermissions';
import { useGame } from '../../context/GameContext';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { migrateChecklistData } from '../../utils/migrateChecklistData';

// Widgets
import InfoWidget from './widgets/InfoWidget';
import CombatWidget from './widgets/CombatWidget';
import WeaponsWidget from './widgets/WeaponsWidget';
import StatsWidget from './widgets/StatsWidget';
import PersonalityWidget from './widgets/PersonalityWidget';
import SkillsWidget from './widgets/SkillsWidget';
import SpecialSkillsWidget from './widgets/SpecialSkillsWidget';
import TemporarySkillsWidget from './widgets/TemporarySkillsWidget';
import PossessionsWidget from './widgets/PossessionsWidget';
import NotesWidget from './widgets/NotesWidget';
import MoneyWidget from './widgets/MoneyWidget';
import LifePointsWidget from './widgets/LifePointsWidget';
import TreasuryWidget from './widgets/TreasuryWidget';
import VehiclesWidget from './widgets/VehiclesWidget';
import CardsWidget from './widgets/CardsWidget';

// Components
import PendingTransfers from '../PendingTransfers';
import ItemTransferModal from '../ItemTransferModal';

const STORAGE_KEY = 'aria-dashboard-layout';

// Ordre par défaut des widgets
const DEFAULT_ORDER = [
  'info', 'combat', 'stats', 'lifePoints',
  'weapons', 'money', 'personality',
  'skills', 'specialSkills', 'temporarySkills',
  'possessions', 'notes', 'treasury', 'vehicles', 'cards'
];

export default function CharacterDashboard({ character, onSave, isEditable = true }) {
  const { canEditCharacter, canViewCharacter, isMJ } = usePermissions();
  const { characters } = useGame();
  const { user } = useAuth();
  const socket = useSocket();

  // État pour la modal de transfert
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [itemToTransfer, setItemToTransfer] = useState(null);
  const [preselectedCharacter, setPreselectedCharacter] = useState(null);

  // État pour l'ordre des widgets
  const [widgetOrder, setWidgetOrder] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}-${user?.id || 'guest'}`);
    if (saved) {
      const savedOrder = JSON.parse(saved);
      // Ajouter les nouveaux widgets qui ne sont pas dans l'ordre sauvegardé
      const missingWidgets = DEFAULT_ORDER.filter(w => !savedOrder.includes(w));
      if (missingWidgets.length > 0) {
        return [...savedOrder, ...missingWidgets];
      }
      return savedOrder;
    }
    return DEFAULT_ORDER;
  });

  const [draggedWidget, setDraggedWidget] = useState(null);
  const [isEditingLayout, setIsEditingLayout] = useState(false);

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
    temporarySkills: character?.temporarySkills || [],
    possessions: migrateChecklistData(character?.possessions),
    notes: migrateChecklistData(character?.notes),
    crowns: character?.crowns || 0,
    orbs: character?.orbs || 0,
    scepters: character?.scepters || 0,
    kings: character?.kings || 0
  }));

  const canEdit = isEditable && canEditCharacter(character);
  const canView = canViewCharacter(character);

  // Sauvegarder l'ordre des widgets
  const saveWidgetOrder = useCallback((newOrder) => {
    setWidgetOrder(newOrder);
    localStorage.setItem(`${STORAGE_KEY}-${user?.id || 'guest'}`, JSON.stringify(newOrder));
  }, [user?.id]);

  // Reset layout
  const resetLayout = () => {
    saveWidgetOrder(DEFAULT_ORDER);
  };

  // Drag and drop handlers
  const handleDragStart = (e, widgetId) => {
    if (!isEditingLayout) return;
    setDraggedWidget(widgetId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetWidgetId) => {
    e.preventDefault();
    if (!draggedWidget || draggedWidget === targetWidgetId) return;

    const newOrder = [...widgetOrder];
    const draggedIndex = newOrder.indexOf(draggedWidget);
    const targetIndex = newOrder.indexOf(targetWidgetId);

    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedWidget);

    saveWidgetOrder(newOrder);
    setDraggedWidget(null);
  };

  const handleDragEnd = () => {
    setDraggedWidget(null);
  };

  // Handlers
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSkillChange = (skillName, value) => {
    setFormData(prev => ({
      ...prev,
      skills: { ...prev.skills, [skillName]: value }
    }));
  };

  const migrateSpecialSkill = (skill) => {
    if (typeof skill === 'string') return { name: skill, percentage: '' };
    if (typeof skill === 'object' && skill !== null) return { name: skill.name || '', percentage: skill.percentage ?? '' };
    return { name: '', percentage: '' };
  };

  const getSpecialSkill = (index) => migrateSpecialSkill(formData.specialSkills[index]);

  const handleSpecialSkillChange = (index, field, value) => {
    setFormData(prev => {
      const currentSkill = migrateSpecialSkill(prev.specialSkills[index]);
      return {
        ...prev,
        specialSkills: {
          ...prev.specialSkills,
          [index]: { ...currentSkill, [field]: value }
        }
      };
    });
  };

  const addTemporarySkill = () => {
    setFormData(prev => ({
      ...prev,
      temporarySkills: [...prev.temporarySkills, { id: Date.now(), name: '', percentage: '', grantedBy: 'MJ' }]
    }));
  };

  const updateTemporarySkill = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      temporarySkills: prev.temporarySkills.map(skill =>
        skill.id === id ? { ...skill, [field]: value } : skill
      )
    }));
  };

  const removeTemporarySkill = (id) => {
    setFormData(prev => ({
      ...prev,
      temporarySkills: prev.temporarySkills.filter(skill => skill.id !== id)
    }));
  };

  const handleTransferItem = (item, targetCharacter = null) => {
    setItemToTransfer(item);
    setPreselectedCharacter(targetCharacter);
    setShowTransferModal(true);
  };

  const handleTransferHandled = () => {
    console.log('Transfert traité');
  };

  // WebSocket listeners
  useEffect(() => {
    if (!socket || !character?.id) return;

    const handleCharacterUpdated = (updatedCharacter) => {
      if (updatedCharacter.id === character.id) {
        const newPossessions = updatedCharacter.possessions
          ? (typeof updatedCharacter.possessions === 'string'
            ? JSON.parse(updatedCharacter.possessions)
            : updatedCharacter.possessions)
          : [];

        setFormData(prev => ({
          ...prev,
          possessions: migrateChecklistData(newPossessions),
          crowns: updatedCharacter.crowns ?? prev.crowns,
          orbs: updatedCharacter.orbs ?? prev.orbs,
          scepters: updatedCharacter.scepters ?? prev.scepters,
          kings: updatedCharacter.kings ?? prev.kings
        }));
      }
    };

    socket.on('characterUpdated', handleCharacterUpdated);
    return () => socket.off('characterUpdated', handleCharacterUpdated);
  }, [socket, character?.id]);

  // Auto-save
  const handleAutoSave = useMemo(() => {
    return async (data) => {
      if (onSave && canEdit) {
        try {
          const normalizedData = {
            ...data,
            possessions: migrateChecklistData(data.possessions),
            notes: migrateChecklistData(data.notes),
            crowns: data.crowns || 0,
            orbs: data.orbs || 0,
            scepters: data.scepters || 0,
            kings: data.kings || 0,
            currentLifePoints: data.currentLifePoints ?? data.lifePoints ?? 0
          };
          await onSave(normalizedData);
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
    };
  }, [onSave, canEdit]);

  const { forceSave, isSaving } = useAutoSave(handleAutoSave, formData, 5000, canEdit);

  // Mettre à jour formData quand le character change
  useEffect(() => {
    if (character?.id) {
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
        temporarySkills: character.temporarySkills || [],
        possessions: migrateChecklistData(character.possessions),
        notes: migrateChecklistData(character.notes),
        crowns: character.crowns || 0,
        orbs: character.orbs || 0,
        scepters: character.scepters || 0,
        kings: character.kings || 0
      });
    }
  }, [character?.id]);

  const widgetProps = {
    formData,
    setFormData,
    onInputChange: handleInputChange,
    onSkillChange: handleSkillChange,
    getSpecialSkill,
    onSpecialSkillChange: handleSpecialSkillChange,
    onAddTemporarySkill: addTemporarySkill,
    onUpdateTemporarySkill: updateTemporarySkill,
    onRemoveTemporarySkill: removeTemporarySkill,
    onTransferItem: handleTransferItem,
    canEdit,
    characters,
    character,
    characterId: character?.id,
    isMJ: isMJ()
  };

  // Map des widgets avec widgetId pour la sauvegarde des tailles
  const widgetComponents = {
    info: <InfoWidget {...widgetProps} widgetId="info" />,
    combat: <CombatWidget {...widgetProps} widgetId="combat" />,
    stats: <StatsWidget {...widgetProps} widgetId="stats" />,
    weapons: <WeaponsWidget {...widgetProps} widgetId="weapons" />,
    lifePoints: <LifePointsWidget {...widgetProps} widgetId="lifePoints" />,
    money: <MoneyWidget {...widgetProps} widgetId="money" />,
    personality: <PersonalityWidget {...widgetProps} widgetId="personality" />,
    skills: <SkillsWidget {...widgetProps} widgetId="skills" />,
    specialSkills: <SpecialSkillsWidget {...widgetProps} widgetId="specialSkills" />,
    temporarySkills: <TemporarySkillsWidget {...widgetProps} widgetId="temporarySkills" />,
    possessions: <PossessionsWidget {...widgetProps} widgetId="possessions" />,
    notes: <NotesWidget {...widgetProps} widgetId="notes" />,
    treasury: <TreasuryWidget {...widgetProps} widgetId="treasury" />,
    vehicles: <VehiclesWidget {...widgetProps} widgetId="vehicles" />,
    cards: <CardsWidget {...widgetProps} widgetId="cards" />
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 p-4">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4 bg-white/80 rounded-xl p-4 shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-4xl">👑</span>
          <div>
            <h1 className="text-2xl font-bold text-amber-900">{formData.name || 'Aventurier'}</h1>
            <p className="text-sm text-amber-700">{formData.function || 'Fonction inconnue'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Tous les utilisateurs peuvent réorganiser leur interface */}
          <button
            onClick={() => setIsEditingLayout(!isEditingLayout)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isEditingLayout
              ? 'bg-amber-600 text-white'
              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
              }`}
          >
            {isEditingLayout ? '✓ Terminer' : '⚙️ Réorganiser'}
          </button>
          {isEditingLayout && (
            <button
              onClick={resetLayout}
              className="px-3 py-2 bg-red-100 text-red-800 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors"
            >
              Réinitialiser
            </button>
          )}
          <div className={`px-3 py-2 rounded-lg text-sm ${isSaving ? 'bg-amber-200 text-amber-800' : 'bg-green-100 text-green-800'
            }`}>
            {isSaving ? '⏳ Sauvegarde...' : '✓ Sauvegardé'}
          </div>
        </div>
      </div>

      {isEditingLayout && (
        <div className="mb-4 p-3 bg-amber-200 rounded-lg text-amber-900 text-sm text-center">
          Glissez-déposez les widgets pour les réorganiser
        </div>
      )}

      {/* Transferts en attente */}
      {character?.id && (
        <div className="mb-4">
          <PendingTransfers
            characterId={character.id}
            characterMoney={{
              crowns: formData.crowns || 0,
              orbs: formData.orbs || 0,
              scepters: formData.scepters || 0,
              kings: formData.kings || 0
            }}
            onTransferHandled={handleTransferHandled}
          />
        </div>
      )}

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {widgetOrder.map((widgetId) => (
          <div
            key={widgetId}
            draggable={isEditingLayout}
            onDragStart={(e) => handleDragStart(e, widgetId)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, widgetId)}
            onDragEnd={handleDragEnd}
            className={`${isEditingLayout ? 'cursor-move' : ''
              } ${draggedWidget === widgetId ? 'opacity-50' : ''
              }`}
          >
            {widgetComponents[widgetId]}
          </div>
        ))}
      </div>

      {/* Modal de transfert */}
      <ItemTransferModal
        isOpen={showTransferModal}
        onClose={() => {
          setShowTransferModal(false);
          setItemToTransfer(null);
          setPreselectedCharacter(null);
        }}
        item={itemToTransfer}
        fromCharacterId={character?.id}
        gameId={character?.gameId || character?.game?.id}
        characters={characters}
        onTransferCreated={handleTransferHandled}
        preselectedCharacterId={preselectedCharacter?.id}
        fromCharacterMoney={{
          crowns: formData.crowns || 0,
          orbs: formData.orbs || 0,
          scepters: formData.scepters || 0,
          kings: formData.kings || 0
        }}
      />
    </div>
  );
}
