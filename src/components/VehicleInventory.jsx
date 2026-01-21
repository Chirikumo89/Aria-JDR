import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { apiService } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

// Fonction pour regrouper les cagettes par nom (stack)
function stackCrates(crates) {
  if (!crates || crates.length === 0) return [];
  
  const stacks = {};
  crates.forEach(crate => {
    const name = crate.name.trim().toLowerCase();
    if (!stacks[name]) {
      stacks[name] = {
        name: crate.name,
        ids: [crate.id],
        count: 1
      };
    } else {
      stacks[name].ids.push(crate.id);
      stacks[name].count++;
    }
  });
  
  return Object.values(stacks).sort((a, b) => a.name.localeCompare(b.name));
}

export default function VehicleInventory({ gameId, disabled = false }) {
  const socket = useSocket();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // États pour le formulaire de création (MJ)
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newVehicleName, setNewVehicleName] = useState('');
  const [newVehicleMaxCrates, setNewVehicleMaxCrates] = useState(1);
  
  // États pour la demande de véhicule (Joueur)
  const [showVehicleRequestForm, setShowVehicleRequestForm] = useState(false);
  const [requestVehicleName, setRequestVehicleName] = useState('');
  const [requestVehicleMaxCrates, setRequestVehicleMaxCrates] = useState(1);
  const [requestVehicleReason, setRequestVehicleReason] = useState('');
  
  // État pour l'édition d'un véhicule
  const [editingVehicle, setEditingVehicle] = useState(null);
  
  // État pour le véhicule sélectionné (pour voir/modifier les cagettes)
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  
  // État pour l'ajout de cagette
  const [newCrateName, setNewCrateName] = useState('');
  const [newCrateQuantity, setNewCrateQuantity] = useState(1);
  
  // État pour la demande d'augmentation de capacité
  const [showRequestForm, setShowRequestForm] = useState(null);
  const [requestedSlots, setRequestedSlots] = useState(1);
  const [requestReason, setRequestReason] = useState('');

  const isMJ = user?.role === 'mj';

  // Charger les véhicules depuis la base de données
  const loadVehicles = useCallback(async () => {
    if (!gameId) return;
    try {
      setLoading(true);
      const vehiclesData = await apiService.getVehicles(gameId);
      setVehicles(vehiclesData);
      
      // Mettre à jour le véhicule sélectionné si nécessaire
      if (selectedVehicle) {
        const updated = vehiclesData.find(v => v.id === selectedVehicle.id);
        if (updated) {
          setSelectedVehicle(updated);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des véhicules:', error);
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    if (gameId) {
      loadVehicles();
    } else {
      setLoading(false);
    }
  }, [gameId, loadVehicles]);

  // Écouter les mises à jour en temps réel via WebSocket
  useEffect(() => {
    if (!socket || !gameId) return;

    const handleVehicleCreated = (data) => {
      if (data.gameId === gameId && data.vehicle) {
        setVehicles(prev => [data.vehicle, ...prev]);
        if (showNotification) {
          showNotification({
            type: 'info',
            message: `Nouveau véhicule ajouté: ${data.vehicle.name}`
          });
        }
      }
    };

    const handleVehicleUpdated = (data) => {
      if (data.gameId === gameId && data.vehicle) {
        setVehicles(prev => prev.map(v => 
          v.id === data.vehicle.id ? data.vehicle : v
        ));
        // Mettre à jour le véhicule sélectionné si c'est le même
        setSelectedVehicle(prev => 
          prev?.id === data.vehicle.id ? data.vehicle : prev
        );
      }
    };

    const handleVehicleDeleted = (data) => {
      if (data.gameId === gameId && data.vehicleId) {
        setVehicles(prev => prev.filter(v => v.id !== data.vehicleId));
        if (selectedVehicle?.id === data.vehicleId) {
          setSelectedVehicle(null);
        }
        if (showNotification) {
          showNotification({
            type: 'warning',
            message: 'Un véhicule a été supprimé'
          });
        }
      }
    };

    socket.on('vehicleCreated', handleVehicleCreated);
    socket.on('vehicleUpdated', handleVehicleUpdated);
    socket.on('vehicleDeleted', handleVehicleDeleted);

    return () => {
      socket.off('vehicleCreated', handleVehicleCreated);
      socket.off('vehicleUpdated', handleVehicleUpdated);
      socket.off('vehicleDeleted', handleVehicleDeleted);
    };
  }, [socket, gameId, showNotification]);

  // Créer un nouveau véhicule (MJ)
  const handleCreateVehicle = async (closeAfter = false) => {
    if (!newVehicleName.trim()) {
      alert('Veuillez saisir un nom pour le véhicule');
      return;
    }

    try {
      setSaving(true);
      await apiService.createVehicle(gameId, { 
        name: newVehicleName,
        maxCrates: newVehicleMaxCrates 
      });
      setNewVehicleName('');
      setNewVehicleMaxCrates(1);
      if (closeAfter) {
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error('Erreur lors de la création du véhicule:', error);
      alert(error.message || 'Erreur lors de la création du véhicule');
    } finally {
      setSaving(false);
    }
  };

  // Demander un nouveau véhicule (Joueur)
  const handleRequestVehicle = async () => {
    if (!requestVehicleName.trim()) {
      alert('Veuillez saisir un nom pour le véhicule');
      return;
    }

    try {
      setSaving(true);
      await apiService.createVehicleRequest(gameId, { 
        vehicleName: requestVehicleName,
        maxCrates: requestVehicleMaxCrates,
        reason: requestVehicleReason.trim() || null
      });
      
      setRequestVehicleName('');
      setRequestVehicleMaxCrates(1);
      setRequestVehicleReason('');
      setShowVehicleRequestForm(false);
      
      if (showNotification) {
        showNotification({
          type: 'success',
          message: 'Demande de véhicule envoyée au MJ'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la demande de véhicule:', error);
      alert(error.message || 'Erreur lors de la demande de véhicule');
    } finally {
      setSaving(false);
    }
  };

  // Mettre à jour un véhicule
  const handleUpdateVehicle = async (vehicleId, data) => {
    try {
      setSaving(true);
      await apiService.updateVehicle(vehicleId, data);
      setEditingVehicle(null);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du véhicule:', error);
      alert(error.message || 'Erreur lors de la mise à jour du véhicule');
    } finally {
      setSaving(false);
    }
  };

  // Supprimer un véhicule (MJ seulement)
  const handleDeleteVehicle = async (vehicleId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce véhicule et toutes ses cagettes ?')) {
      return;
    }

    try {
      setSaving(true);
      await apiService.deleteVehicle(vehicleId);
    } catch (error) {
      console.error('Erreur lors de la suppression du véhicule:', error);
      alert(error.message || 'Erreur lors de la suppression du véhicule');
    } finally {
      setSaving(false);
    }
  };

  // Ajouter une ou plusieurs cagettes
  const handleAddCrates = async (vehicleId) => {
    if (!newCrateName.trim()) {
      alert('Veuillez saisir un nom pour la cagette');
      return;
    }

    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;

    const currentCratesCount = vehicle.crates?.length || 0;
    const quantity = Math.max(1, newCrateQuantity);
    const availableSlots = vehicle.maxCrates - currentCratesCount;
    
    // Vérifier strictement la limite
    if (availableSlots <= 0) {
      alert(`Limite de ${vehicle.maxCrates} cagette(s) atteinte. ${isMJ ? 'Modifiez le nombre max dans les paramètres du véhicule.' : 'Faites une demande au MJ pour augmenter la capacité.'}`);
      return;
    }

    // Limiter la quantité aux slots disponibles
    const actualQuantity = Math.min(quantity, availableSlots);
    if (actualQuantity < quantity) {
      alert(`Seulement ${availableSlots} slot(s) disponible(s). ${actualQuantity} cagette(s) seront ajoutées.`);
    }

    // Créer les nouvelles cagettes
    const newCrates = Array.from({ length: actualQuantity }, (_, i) => ({
      id: `crate-${Date.now()}-${i}`,
      name: newCrateName.trim()
    }));

    const updatedCrates = [...(vehicle.crates || []), ...newCrates];

    try {
      setSaving(true);
      await apiService.updateVehicle(vehicleId, { crates: updatedCrates });
      setNewCrateName('');
      setNewCrateQuantity(1);
    } catch (error) {
      console.error('Erreur lors de l\'ajout des cagettes:', error);
      alert(error.message || 'Erreur lors de l\'ajout des cagettes');
    } finally {
      setSaving(false);
    }
  };

  // Retirer une ou plusieurs cagettes d'un stack
  const handleRemoveFromStack = async (vehicleId, stack, quantityToRemove = 1) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;

    // Retirer les X premiers IDs du stack
    const idsToRemove = stack.ids.slice(0, quantityToRemove);
    const updatedCrates = vehicle.crates.filter(c => !idsToRemove.includes(c.id));

    try {
      setSaving(true);
      await apiService.updateVehicle(vehicleId, { crates: updatedCrates });
    } catch (error) {
      console.error('Erreur lors de la suppression des cagettes:', error);
      alert(error.message || 'Erreur lors de la suppression des cagettes');
    } finally {
      setSaving(false);
    }
  };

  // Soumettre une demande d'augmentation de capacité
  const handleSubmitRequest = async (vehicleId) => {
    if (requestedSlots < 1) {
      alert('Le nombre de slots demandés doit être au moins 1');
      return;
    }

    try {
      setSaving(true);
      await apiService.createCrateRequest(vehicleId, {
        requestedSlots: requestedSlots,
        reason: requestReason.trim() || null
      });
      
      setShowRequestForm(null);
      setRequestedSlots(1);
      setRequestReason('');
      
      if (showNotification) {
        showNotification({
          type: 'success',
          message: 'Demande envoyée au MJ'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la demande:', error);
      alert(error.message || 'Erreur lors de la demande');
    } finally {
      setSaving(false);
    }
  };

  if (!gameId) {
    return null;
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-ink/70 italic">Chargement des véhicules...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#334155' }}>
          🚢 VÉHICULES & CALES
        </h3>
        <div className="flex gap-2">
          {/* Bouton pour demander un véhicule (Joueur) */}
          {!isMJ && (
            <button
              onClick={() => setShowVehicleRequestForm(!showVehicleRequestForm)}
              disabled={disabled || saving}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-medium hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 shadow-sm transition-all"
            >
              {showVehicleRequestForm ? '✕ Annuler' : '📝 Demander un véhicule'}
            </button>
          )}
          {/* Bouton pour créer un véhicule (MJ) */}
          {isMJ && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              disabled={disabled || saving}
              className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg text-sm font-medium hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 shadow-sm transition-all"
            >
              {showCreateForm ? '✕ Annuler' : '+ Ajouter un véhicule'}
            </button>
          )}
        </div>
      </div>

      {/* Formulaire de demande de véhicule (Joueur) */}
      {showVehicleRequestForm && !isMJ && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 shadow-sm">
          <h4 className="text-md font-bold mb-3" style={{ color: '#92400e' }}>📝 Demander un nouveau véhicule</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#b45309' }}>Nom du véhicule souhaité</label>
              <input
                type="text"
                value={requestVehicleName}
                onChange={(e) => setRequestVehicleName(e.target.value)}
                className="w-full p-2.5 border border-amber-200 bg-white rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                style={{ color: '#1e293b' }}
                placeholder="Ex: La Perle Noire, Chariot..."
                disabled={saving}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#b45309' }}>Capacité souhaitée (cagettes)</label>
              <input
                type="number"
                min="1"
                max="50"
                value={requestVehicleMaxCrates}
                onChange={(e) => setRequestVehicleMaxCrates(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full p-2.5 border border-amber-200 bg-white rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                style={{ color: '#1e293b' }}
                disabled={saving}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#b45309' }}>Raison (optionnel)</label>
              <input
                type="text"
                value={requestVehicleReason}
                onChange={(e) => setRequestVehicleReason(e.target.value)}
                className="w-full p-2.5 border border-amber-200 bg-white rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                style={{ color: '#1e293b' }}
                placeholder="Pourquoi avez-vous besoin de ce véhicule ?"
                disabled={saving}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => {
                setShowVehicleRequestForm(false);
                setRequestVehicleName('');
                setRequestVehicleMaxCrates(1);
                setRequestVehicleReason('');
              }}
              className="px-4 py-2 bg-white border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors"
              style={{ color: '#b45309' }}
              disabled={saving}
            >
              Annuler
            </button>
            <button
              onClick={handleRequestVehicle}
              disabled={saving || !requestVehicleName.trim()}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 shadow-sm transition-all"
            >
              {saving ? 'Envoi...' : 'Envoyer la demande'}
            </button>
          </div>
        </div>
      )}

      {/* Formulaire de création (MJ seulement) */}
      {showCreateForm && isMJ && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 shadow-sm">
          <h4 className="text-md font-bold mb-3" style={{ color: '#155e75' }}>Nouveau véhicule</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#0e7490' }}>Nom du véhicule</label>
              <input
                type="text"
                value={newVehicleName}
                onChange={(e) => setNewVehicleName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateVehicle()}
                className="w-full p-2.5 border border-cyan-200 bg-white rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                style={{ color: '#1e293b' }}
                placeholder="Ex: La Perle Noire, Chariot..."
                disabled={saving}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#0e7490' }}>Nombre max de cagettes</label>
              <input
                type="number"
                min="1"
                max="50"
                value={newVehicleMaxCrates}
                onChange={(e) => setNewVehicleMaxCrates(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full p-2.5 border border-cyan-200 bg-white rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                style={{ color: '#1e293b' }}
                disabled={saving}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 bg-white border border-cyan-300 rounded-lg hover:bg-cyan-50 transition-colors"
              style={{ color: '#0e7490' }}
              disabled={saving}
            >
              Fermer
            </button>
            <button
              onClick={() => handleCreateVehicle(false)}
              disabled={saving || !newVehicleName.trim()}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 shadow-sm transition-all"
            >
              {saving ? 'Création...' : '+ Ajouter'}
            </button>
            <button
              onClick={() => handleCreateVehicle(true)}
              disabled={saving || !newVehicleName.trim()}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 shadow-sm transition-all"
            >
              {saving ? 'Création...' : 'Ajouter et fermer'}
            </button>
          </div>
        </div>
      )}

      {/* Liste des véhicules */}
      {vehicles.length === 0 ? (
        <div className="text-center py-8" style={{ color: '#64748b' }}>
          <div className="text-4xl mb-2">🚢</div>
          <p>Aucun véhicule pour cette partie.</p>
          {isMJ && <p className="text-sm mt-2">Cliquez sur "Ajouter un véhicule" pour en créer un.</p>}
          {!isMJ && <p className="text-sm mt-2">Vous pouvez demander au MJ d'ajouter un véhicule.</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {vehicles.map(vehicle => {
            const currentCratesCount = vehicle.crates?.length || 0;
            const isAtLimit = currentCratesCount >= vehicle.maxCrates;
            const availableSlots = vehicle.maxCrates - currentCratesCount;
            const stackedCrates = stackCrates(vehicle.crates);
            const fillPercent = (currentCratesCount / vehicle.maxCrates) * 100;
            
            return (
              <div key={vehicle.id} className="rounded-xl bg-white shadow-md border border-slate-200 overflow-hidden">
                {/* En-tête du véhicule */}
                <div 
                  className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setSelectedVehicle(selectedVehicle?.id === vehicle.id ? null : vehicle)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-2xl shadow-sm">
                      🚢
                    </div>
                    <div>
                      <h4 className="font-bold" style={{ color: '#1e293b' }}>{vehicle.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${isAtLimit ? 'bg-red-500' : 'bg-gradient-to-r from-cyan-400 to-blue-500'}`}
                            style={{ width: `${fillPercent}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium" style={{ color: isAtLimit ? '#dc2626' : '#475569' }}>
                          {currentCratesCount}/{vehicle.maxCrates}
                        </span>
                        {isAtLimit && <span className="text-xs font-medium" style={{ color: '#ef4444' }}>Plein</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Bouton d'édition pour tous (nom) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingVehicle({...vehicle});
                      }}
                      className="p-2 hover:bg-cyan-50 rounded-lg transition-colors"
                      style={{ color: '#94a3b8' }}
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    {/* Bouton de suppression (MJ seulement) */}
                    {isMJ && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteVehicle(vehicle.id);
                        }}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        style={{ color: '#94a3b8' }}
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    )}
                    <span className="ml-1 transition-transform" style={{ color: '#94a3b8', transform: selectedVehicle?.id === vehicle.id ? 'rotate(180deg)' : 'none' }}>
                      ▼
                    </span>
                  </div>
                </div>

                {/* Cale du véhicule (visible si sélectionné) */}
                {selectedVehicle?.id === vehicle.id && (
                  <div className="border-t border-slate-200 p-4 bg-slate-50">
                    <h5 className="font-semibold mb-3 flex items-center gap-2" style={{ color: '#334155' }}>
                      <span>📦</span> Cale du véhicule
                    </h5>
                    
                    {/* Liste des cagettes stackées */}
                    {stackedCrates.length === 0 ? (
                      <p className="text-sm italic mb-4 text-center py-4" style={{ color: '#64748b' }}>Aucune cagette dans ce véhicule.</p>
                    ) : (
                      <div className="space-y-2 mb-4">
                        {stackedCrates.map((stack) => (
                          <div key={stack.name} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                            <span className="text-xl">📦</span>
                            <div className="flex-1">
                              <span className="font-medium" style={{ color: '#1e293b' }}>{stack.name}</span>
                              {stack.count > 1 && (
                                <span className="ml-2 px-2.5 py-0.5 bg-gradient-to-r from-cyan-100 to-blue-100 rounded-full text-sm font-bold" style={{ color: '#0e7490' }}>
                                  x{stack.count}
                                </span>
                              )}
                            </div>
                            {!disabled && (
                              <div className="flex items-center gap-1">
                                {stack.count > 1 && (
                                  <button
                                    onClick={() => handleRemoveFromStack(vehicle.id, stack, 1)}
                                    className="px-2.5 py-1 text-sm hover:bg-orange-100 rounded-lg font-medium transition-colors"
                                    style={{ color: '#ea580c' }}
                                    title="Retirer 1"
                                  >
                                    -1
                                  </button>
                                )}
                                <button
                                  onClick={() => handleRemoveFromStack(vehicle.id, stack, stack.count)}
                                  className="px-2.5 py-1 text-sm hover:bg-red-100 rounded-lg font-medium transition-colors"
                                  style={{ color: '#ef4444' }}
                                  title={stack.count > 1 ? `Retirer tout (${stack.count})` : 'Retirer'}
                                >
                                  {stack.count > 1 ? `✕ Tout` : '✕'}
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Formulaire d'ajout de cagettes ou demande */}
                    {!disabled && (
                      <>
                        {!isAtLimit ? (
                          <div className="p-4 bg-white rounded-lg border-2 border-dashed border-slate-300">
                            {/* Ligne 1: Nom de la cagette */}
                            <div style={{ marginBottom: '12px' }}>
                              <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>Nom de la cagette</label>
                              <input
                                type="text"
                                value={newCrateName}
                                onChange={(e) => setNewCrateName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleAddCrates(vehicle.id);
                                  }
                                }}
                                className="w-full p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                                style={{ color: '#1e293b' }}
                                placeholder="Ex: Alcool de mouette, Épices..."
                                disabled={saving}
                              />
                            </div>
                            
                            {/* Ligne 2: Quantité et bouton Ajouter */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: '#475569', fontSize: '14px', fontWeight: '500' }}>Quantité :</span>
                                <button
                                  type="button"
                                  onClick={() => setNewCrateQuantity(Math.max(1, newCrateQuantity - 1))}
                                  disabled={saving || newCrateQuantity <= 1}
                                  style={{
                                    width: '36px',
                                    height: '36px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    backgroundColor: saving || newCrateQuantity <= 1 ? '#f1f5f9' : 'white',
                                    color: saving || newCrateQuantity <= 1 ? '#94a3b8' : '#1e293b',
                                    fontSize: '20px',
                                    fontWeight: 'bold',
                                    cursor: saving || newCrateQuantity <= 1 ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    lineHeight: 1
                                  }}
                                >
                                  −
                                </button>
                                <span 
                                  style={{
                                    minWidth: '40px',
                                    height: '36px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: '700',
                                    fontSize: '18px',
                                    color: '#1e293b',
                                    backgroundColor: '#e2e8f0',
                                    borderRadius: '8px',
                                    padding: '0 12px'
                                  }}
                                >
                                  {newCrateQuantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setNewCrateQuantity(Math.min(availableSlots, newCrateQuantity + 1))}
                                  disabled={saving || newCrateQuantity >= availableSlots}
                                  style={{
                                    width: '36px',
                                    height: '36px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    backgroundColor: saving || newCrateQuantity >= availableSlots ? '#f1f5f9' : 'white',
                                    color: saving || newCrateQuantity >= availableSlots ? '#94a3b8' : '#1e293b',
                                    fontSize: '20px',
                                    fontWeight: 'bold',
                                    cursor: saving || newCrateQuantity >= availableSlots ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    lineHeight: 1
                                  }}
                                >
                                  +
                                </button>
                              </div>
                              
                              <button
                                onClick={() => handleAddCrates(vehicle.id)}
                                disabled={saving || !newCrateName.trim()}
                                style={{
                                  padding: '10px 20px',
                                  backgroundColor: saving || !newCrateName.trim() ? '#94a3b8' : '#10b981',
                                  color: 'white',
                                  borderRadius: '8px',
                                  border: 'none',
                                  fontWeight: '600',
                                  fontSize: '14px',
                                  cursor: saving || !newCrateName.trim() ? 'not-allowed' : 'pointer',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                }}
                              >
                                Ajouter
                              </button>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                              <span className="text-xs" style={{ color: '#64748b' }}>
                                {availableSlots} slot{availableSlots > 1 ? 's' : ''} disponible{availableSlots > 1 ? 's' : ''}
                              </span>
                              {!isMJ && (
                                <button
                                  type="button"
                                  onClick={() => setShowRequestForm(vehicle.id)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#0891b2',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                  }}
                                >
                                  Demander plus de capacité
                                </button>
                              )}
                              {isMJ && (
                                <button
                                  type="button"
                                  onClick={() => setEditingVehicle({...vehicle})}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#0891b2',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                  }}
                                >
                                  Modifier la capacité
                                </button>
                              )}
                            </div>
                            
                            {/* Formulaire de demande (si ouvert) */}
                            {showRequestForm === vehicle.id && !isMJ && (
                              <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#92400e', marginBottom: '10px' }}>
                                  Demander une augmentation de capacité
                                </div>
                                <div style={{ marginBottom: '8px' }}>
                                  <label style={{ display: 'block', fontSize: '12px', color: '#b45309', marginBottom: '4px' }}>Nombre de slots supplémentaires</label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={requestedSlots}
                                    onChange={(e) => setRequestedSlots(Math.max(1, parseInt(e.target.value) || 1))}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #fcd34d', borderRadius: '6px', backgroundColor: 'white', color: '#1e293b' }}
                                    disabled={saving}
                                  />
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                  <label style={{ display: 'block', fontSize: '12px', color: '#b45309', marginBottom: '4px' }}>Raison (optionnel)</label>
                                  <input
                                    type="text"
                                    value={requestReason}
                                    onChange={(e) => setRequestReason(e.target.value)}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #fcd34d', borderRadius: '6px', backgroundColor: 'white', color: '#1e293b' }}
                                    placeholder="Pourquoi avez-vous besoin de plus de place ?"
                                    disabled={saving}
                                  />
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowRequestForm(null);
                                      setRequestedSlots(1);
                                      setRequestReason('');
                                    }}
                                    style={{
                                      flex: 1,
                                      padding: '8px',
                                      backgroundColor: 'white',
                                      color: '#b45309',
                                      border: '1px solid #fcd34d',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      fontWeight: '500'
                                    }}
                                    disabled={saving}
                                  >
                                    Annuler
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSubmitRequest(vehicle.id)}
                                    disabled={saving || requestedSlots < 1}
                                    style={{
                                      flex: 1,
                                      padding: '8px',
                                      backgroundColor: '#f59e0b',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '6px',
                                      cursor: saving || requestedSlots < 1 ? 'not-allowed' : 'pointer',
                                      fontWeight: '500',
                                      opacity: saving || requestedSlots < 1 ? 0.5 : 1
                                    }}
                                  >
                                    {saving ? 'Envoi...' : 'Envoyer'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border border-red-200">
                            {showRequestForm === vehicle.id ? (
                              <div className="space-y-3">
                                <div className="text-sm font-semibold" style={{ color: '#991b1b' }}>
                                  Demander une augmentation de capacité au MJ
                                </div>
                                <div>
                                  <label className="block text-xs font-medium mb-1" style={{ color: '#b91c1c' }}>Nombre de slots supplémentaires</label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={requestedSlots}
                                    onChange={(e) => setRequestedSlots(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-full p-2.5 border border-red-200 rounded-lg bg-white focus:ring-2 focus:ring-red-400 focus:border-transparent"
                                    style={{ color: '#1e293b' }}
                                    disabled={saving}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium mb-1" style={{ color: '#b91c1c' }}>Raison (optionnel)</label>
                                  <input
                                    type="text"
                                    value={requestReason}
                                    onChange={(e) => setRequestReason(e.target.value)}
                                    className="w-full p-2.5 border border-red-200 rounded-lg bg-white focus:ring-2 focus:ring-red-400 focus:border-transparent"
                                    style={{ color: '#1e293b' }}
                                    placeholder="Pourquoi avez-vous besoin de plus de place ?"
                                    disabled={saving}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setShowRequestForm(null);
                                      setRequestedSlots(1);
                                      setRequestReason('');
                                    }}
                                    className="flex-1 px-3 py-2 bg-white border border-red-300 rounded-lg hover:bg-red-50 font-medium transition-colors"
                                    style={{ color: '#b91c1c' }}
                                    disabled={saving}
                                  >
                                    Annuler
                                  </button>
                                  <button
                                    onClick={() => handleSubmitRequest(vehicle.id)}
                                    disabled={saving || requestedSlots < 1}
                                    className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 font-medium shadow-sm transition-all"
                                  >
                                    {saving ? 'Envoi...' : 'Envoyer la demande'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div className="text-sm" style={{ color: '#b91c1c' }}>
                                  <span className="font-semibold">⚠️ Limite atteinte</span> ({currentCratesCount}/{vehicle.maxCrates})
                                  <br />
                                  <span className="text-xs" style={{ color: '#dc2626' }}>Impossible d'ajouter plus de cagettes</span>
                                </div>
                                {!isMJ && (
                                  <button
                                    onClick={() => setShowRequestForm(vehicle.id)}
                                    className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 font-medium shadow-sm transition-all"
                                  >
                                    Demander au MJ
                                  </button>
                                )}
                                {isMJ && (
                                  <button
                                    onClick={() => setEditingVehicle({...vehicle})}
                                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm rounded-lg hover:from-cyan-600 hover:to-blue-600 font-medium shadow-sm transition-all"
                                  >
                                    Modifier la limite
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal d'édition du véhicule - portail vers le body */}
      {editingVehicle && createPortal(
        <div 
          className="fixed inset-0 bg-black/60 flex items-center justify-center"
          style={{ zIndex: 99999 }}
          onClick={() => setEditingVehicle(null)}
        >
          <div 
            className="bg-white p-6 rounded-lg shadow-2xl max-w-md w-full mx-4 border border-gray-300" 
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-lg font-bold mb-4" style={{ color: '#111827' }}>Modifier le véhicule</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  value={editingVehicle.name}
                  onChange={(e) => setEditingVehicle(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 border border-gray-300 bg-white text-gray-900 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {/* Seul le MJ peut modifier maxCrates */}
              {isMJ && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre max de cagettes</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={editingVehicle.maxCrates}
                    onChange={(e) => setEditingVehicle(prev => ({ ...prev, maxCrates: Math.max(1, parseInt(e.target.value) || 1) }))}
                    className="w-full p-2 border border-gray-300 bg-white text-gray-900 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Actuellement: {editingVehicle.crates?.length || 0} cagette(s) utilisée(s)
                  </p>
                  {editingVehicle.maxCrates < (editingVehicle.crates?.length || 0) && (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ La nouvelle limite est inférieure au nombre de cagettes actuelles
                    </p>
                  )}
                </div>
              )}
              {!isMJ && (
                <p className="text-xs text-gray-600">
                  Capacité actuelle: {editingVehicle.maxCrates} cagette(s) max (seul le MJ peut modifier cette valeur)
                </p>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setEditingVehicle(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded hover:bg-gray-100"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  const updateData = { name: editingVehicle.name };
                  if (isMJ) {
                    updateData.maxCrates = editingVehicle.maxCrates;
                  }
                  handleUpdateVehicle(editingVehicle.id, updateData);
                }}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
              {saving ? 'Sauvegarde...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {saving && (
        <div className="text-center text-sm italic" style={{ color: '#64748b' }}>
          💾 Sauvegarde en cours...
        </div>
      )}
    </div>
  );
}
