import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook pour la sauvegarde automatique avec debounce
 * @param {Function} saveFunction - Fonction de sauvegarde
 * @param {Object} data - Données à sauvegarder
 * @param {number} delay - Délai en millisecondes (défaut: 2000)
 * @param {boolean} enabled - Si la sauvegarde automatique est activée
 */
export function useAutoSave(saveFunction, data, delay = 2000, enabled = true) {
  const timeoutRef = useRef(null);
  const previousDataRef = useRef(null);
  const isSavingRef = useRef(false);
  const isInitializedRef = useRef(false);

  // Fonction de sauvegarde avec gestion des erreurs
  const save = useCallback(async () => {
    if (isSavingRef.current || !enabled) return;
    
    try {
      isSavingRef.current = true;
      await saveFunction(data);
      console.log('Auto-save successful');
      // Mettre à jour previousDataRef APRÈS la sauvegarde réussie
      previousDataRef.current = JSON.parse(JSON.stringify(data));
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      isSavingRef.current = false;
    }
  }, [saveFunction, data, enabled]);

  // Effet pour la sauvegarde automatique avec debounce
  useEffect(() => {
    // Vérifier si les données ont changé
    if (!enabled || !data) {
      return;
    }

    // Initialiser previousDataRef si c'est la première fois
    if (!isInitializedRef.current) {
      previousDataRef.current = JSON.parse(JSON.stringify(data));
      isInitializedRef.current = true;
      console.log('Initial data set, no save needed');
      return;
    }

    // Comparaison simple mais efficace
    const currentDataString = JSON.stringify(data);
    const previousDataString = JSON.stringify(previousDataRef.current);
    
    const hasChanged = currentDataString !== previousDataString;

    if (!hasChanged) {
      console.log('No data change detected, skipping save');
      return;
    }

    console.log('Data changed, scheduling save...');

    // Annuler la sauvegarde précédente
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Programmer une nouvelle sauvegarde
    timeoutRef.current = setTimeout(() => {
      save();
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, enabled, save]);

  // Fonction pour forcer la sauvegarde immédiate
  const forceSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    save();
  }, [save]);

  // Fonction pour annuler la sauvegarde en cours
  const cancelSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return {
    forceSave,
    cancelSave,
    isSaving: isSavingRef.current
  };
}
