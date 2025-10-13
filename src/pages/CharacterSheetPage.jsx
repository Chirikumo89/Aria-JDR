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
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header moderne avec glassmorphism */}
        <div className="mb-10 p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl animate-fadeIn">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Fiche de personnage
                </span>
              </h1>
              <div className="flex items-center gap-3 text-secondary">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="font-semibold">{character.name}</span>
                </div>
                <span className="text-muted">•</span>
                <span>Joué par {character.playerName}</span>
              </div>
            </div>

            {/* Badge de statut */}
            <div>
              {canView && !canEdit && (
                <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="font-semibold">Mode lecture seule</span>
                </div>
              )}
              {canEdit && (
                <div className="px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span className="font-semibold">Sauvegarde automatique</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fiche de personnage */}
        <div className="animate-scaleIn" style={{animationDelay: '0.2s'}}>
          <CharacterSheet
            character={character}
            onSave={canEdit ? handleSave : null}
            isEditable={canEdit}
          />
        </div>

        {/* Actions */}
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4 animate-fadeIn" style={{animationDelay: '0.4s'}}>
          <button
            onClick={() => navigate('/games')}
            className="group relative px-8 py-4 bg-white/5 backdrop-blur-sm text-white rounded-2xl font-semibold text-lg border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all duration-300"
          >
            <span className="relative flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retour aux parties
            </span>
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
              className="group relative px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-2xl font-semibold text-lg shadow-lg hover:shadow-green-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="relative flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
