import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import apiService from '../services/api';
import { CharacterDashboard } from '../components/Dashboard';
import CrateRequestsPanel from '../components/CrateRequestsPanel';

export default function CharacterSheetPage() {
  const { characterId } = useParams();
  const navigate = useNavigate();
  const { characters, updateCharacter, loadCharacters } = useGame();
  const { user } = useAuth();
  const { canViewCharacter, canEditCharacter } = usePermissions();
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Référence pour éviter les appels multiples
  const hasLoadedCharactersRef = useRef(false);

  // Charger le personnage uniquement au montage ou quand l'ID change
  // Ne PAS dépendre de `characters` pour éviter les re-renders en boucle après sauvegarde
  useEffect(() => {
    const loadCharacter = async () => {
      try {
        setLoading(true);
        
        // Charger depuis l'API
        const characterData = await apiService.getCharacter(characterId);
        setCharacter(characterData);
        
        // Charger aussi les autres personnages de la partie pour les transferts (une seule fois)
        if (characterData.gameId && !hasLoadedCharactersRef.current) {
          hasLoadedCharactersRef.current = true;
          loadCharacters(characterData.gameId);
        }
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
    
    // Réinitialiser le flag quand l'ID change
    return () => {
      hasLoadedCharactersRef.current = false;
    };
  }, [characterId, navigate]);
  // Note: loadCharacters est volontairement exclu des dépendances pour éviter les re-renders en boucle

  const handleSave = async (formData) => {
    if (!character) return;

    try {
      setSaving(true);
      
      // Préparer les données pour l'API
      console.log('📥 CharacterSheetPage: Received formData:', formData);
      console.log('📥 CharacterSheetPage: currentLifePoints from formData:', formData.currentLifePoints);
      
      const characterData = {
        name: formData.name,
        function: formData.function,
        age: formData.age ? parseInt(formData.age) : null,
        lifePoints: formData.lifePoints ? parseInt(formData.lifePoints) : null,
        currentLifePoints: formData.currentLifePoints ? parseInt(formData.currentLifePoints) : (formData.lifePoints ? parseInt(formData.lifePoints) : null),
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
        temporarySkills: formData.temporarySkills,
        possessions: formData.possessions,
        notes: formData.notes,
        // Système monétaire
        crowns: formData.crowns ? parseInt(formData.crowns) : 0,
        orbs: formData.orbs ? parseInt(formData.orbs) : 0,
        scepters: formData.scepters ? parseInt(formData.scepters) : 0,
        kings: formData.kings ? parseInt(formData.kings) : 0
      };

      console.log('📤 CharacterSheetPage: Sending characterData to API:', characterData);
      console.log('📤 CharacterSheetPage: currentLifePoints being sent:', characterData.currentLifePoints);

      // Sauvegarder directement via l'API sans passer par le contexte
      // pour éviter les re-renders en cascade
      await apiService.updateCharacter(character.id, characterData);
      
      // Ne PAS mettre à jour l'état local ici pour éviter les re-renders
      // Le formulaire a déjà les données à jour (c'est lui qui les a envoyées)

      // Notification silencieuse pour l'auto-save (pas de popup)
      console.log('✅ Auto-save successful for character:', character?.name);
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
    <div className="min-h-screen">
      {/* Dashboard de personnage */}
      <CharacterDashboard
        character={character}
        onSave={canEdit ? handleSave : null}
        isEditable={canEdit}
      />

      {/* Bouton retour flottant */}
      <button
        onClick={() => navigate('/games')}
        className="fixed bottom-6 left-6 z-50 px-4 py-3 bg-white/90 backdrop-blur-sm text-amber-900 rounded-xl font-semibold shadow-lg hover:bg-white transition-all duration-300 flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Retour
      </button>

      {/* Panel des demandes de cagettes (MJ seulement) */}
      <CrateRequestsPanel gameId={character?.gameId || character?.game?.id} />
    </div>
  );
}
