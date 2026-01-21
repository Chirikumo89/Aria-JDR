import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export default function CrateRequestsPanel({ gameId }) {
  const socket = useSocket();
  const { user } = useAuth();
  const [crateRequests, setCrateRequests] = useState([]);
  const [vehicleRequests, setVehicleRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'crates', 'vehicles'

  const isMJ = user?.role === 'mj';

  // Charger les demandes en attente
  const loadRequests = useCallback(async () => {
    if (!gameId || !isMJ) return;
    try {
      setLoading(true);
      const [crateData, vehicleData] = await Promise.all([
        apiService.getCrateRequests(gameId, 'pending'),
        apiService.getVehicleRequests(gameId, 'pending')
      ]);
      setCrateRequests(crateData);
      setVehicleRequests(vehicleData);
    } catch (error) {
      console.error('Erreur lors du chargement des demandes:', error);
    } finally {
      setLoading(false);
    }
  }, [gameId, isMJ]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Écouter les mises à jour en temps réel pour les demandes de cagettes
  useEffect(() => {
    if (!socket || !gameId || !isMJ) return;

    const handleCrateRequestCreated = (data) => {
      if (data.gameId === gameId && data.request) {
        setCrateRequests(prev => [data.request, ...prev]);
      }
    };

    const handleCrateRequestUpdated = (data) => {
      if (data.gameId === gameId && data.request) {
        if (data.request.status !== 'pending') {
          setCrateRequests(prev => prev.filter(r => r.id !== data.request.id));
        } else {
          setCrateRequests(prev => prev.map(r => 
            r.id === data.request.id ? data.request : r
          ));
        }
      }
    };

    const handleCrateRequestDeleted = (data) => {
      if (data.gameId === gameId && data.requestId) {
        setCrateRequests(prev => prev.filter(r => r.id !== data.requestId));
      }
    };

    socket.on('crateRequestCreated', handleCrateRequestCreated);
    socket.on('crateRequestUpdated', handleCrateRequestUpdated);
    socket.on('crateRequestDeleted', handleCrateRequestDeleted);

    return () => {
      socket.off('crateRequestCreated', handleCrateRequestCreated);
      socket.off('crateRequestUpdated', handleCrateRequestUpdated);
      socket.off('crateRequestDeleted', handleCrateRequestDeleted);
    };
  }, [socket, gameId, isMJ]);

  // Écouter les mises à jour en temps réel pour les demandes de véhicules
  useEffect(() => {
    if (!socket || !gameId || !isMJ) return;

    const handleVehicleRequestCreated = (data) => {
      if (data.gameId === gameId && data.request) {
        setVehicleRequests(prev => [data.request, ...prev]);
      }
    };

    const handleVehicleRequestUpdated = (data) => {
      if (data.gameId === gameId && data.request) {
        if (data.request.status !== 'pending') {
          setVehicleRequests(prev => prev.filter(r => r.id !== data.request.id));
        } else {
          setVehicleRequests(prev => prev.map(r => 
            r.id === data.request.id ? data.request : r
          ));
        }
      }
    };

    const handleVehicleRequestDeleted = (data) => {
      if (data.gameId === gameId && data.requestId) {
        setVehicleRequests(prev => prev.filter(r => r.id !== data.requestId));
      }
    };

    socket.on('vehicleRequestCreated', handleVehicleRequestCreated);
    socket.on('vehicleRequestUpdated', handleVehicleRequestUpdated);
    socket.on('vehicleRequestDeleted', handleVehicleRequestDeleted);

    return () => {
      socket.off('vehicleRequestCreated', handleVehicleRequestCreated);
      socket.off('vehicleRequestUpdated', handleVehicleRequestUpdated);
      socket.off('vehicleRequestDeleted', handleVehicleRequestDeleted);
    };
  }, [socket, gameId, isMJ]);

  // Approuver une demande de cagette
  const handleApproveCrate = async (requestId) => {
    try {
      setProcessing(requestId);
      await apiService.updateCrateRequest(requestId, { status: 'approved' });
    } catch (error) {
      console.error('Erreur lors de l\'approbation:', error);
      alert(error.message);
    } finally {
      setProcessing(null);
    }
  };

  // Rejeter une demande de cagette
  const handleRejectCrate = async (requestId) => {
    try {
      setProcessing(requestId);
      await apiService.updateCrateRequest(requestId, { status: 'rejected' });
    } catch (error) {
      console.error('Erreur lors du rejet:', error);
      alert(error.message);
    } finally {
      setProcessing(null);
    }
  };

  // Approuver une demande de véhicule
  const handleApproveVehicle = async (requestId) => {
    try {
      setProcessing(requestId);
      await apiService.updateVehicleRequest(requestId, { status: 'approved' });
    } catch (error) {
      console.error('Erreur lors de l\'approbation:', error);
      alert(error.message);
    } finally {
      setProcessing(null);
    }
  };

  // Rejeter une demande de véhicule
  const handleRejectVehicle = async (requestId) => {
    try {
      setProcessing(requestId);
      await apiService.updateVehicleRequest(requestId, { status: 'rejected' });
    } catch (error) {
      console.error('Erreur lors du rejet:', error);
      alert(error.message);
    } finally {
      setProcessing(null);
    }
  };

  // Calculer le total des demandes
  const totalRequests = crateRequests.length + vehicleRequests.length;

  // Ne rien afficher si pas MJ ou pas de demandes
  if (!isMJ || totalRequests === 0) {
    return null;
  }

  // Filtrer les demandes selon l'onglet actif
  const filteredCrateRequests = activeTab === 'vehicles' ? [] : crateRequests;
  const filteredVehicleRequests = activeTab === 'crates' ? [] : vehicleRequests;

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-md">
      <div className="bg-amber-100 border-2 border-amber-600 rounded-lg shadow-xl overflow-hidden">
        {/* En-tête */}
        <div className="bg-amber-600 text-white px-4 py-2 flex items-center gap-2">
          <span className="text-lg">📋</span>
          <span className="font-bold">Demandes des joueurs</span>
          <span className="ml-auto bg-white text-amber-600 rounded-full px-2 py-0.5 text-sm font-bold">
            {totalRequests}
          </span>
        </div>

        {/* Onglets */}
        {crateRequests.length > 0 && vehicleRequests.length > 0 && (
          <div className="flex border-b border-amber-300">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 px-3 py-2 text-sm font-medium ${
                activeTab === 'all' 
                  ? 'bg-amber-200 text-amber-900' 
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              Tout ({totalRequests})
            </button>
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`flex-1 px-3 py-2 text-sm font-medium ${
                activeTab === 'vehicles' 
                  ? 'bg-amber-200 text-amber-900' 
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              🚢 Véhicules ({vehicleRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('crates')}
              className={`flex-1 px-3 py-2 text-sm font-medium ${
                activeTab === 'crates' 
                  ? 'bg-amber-200 text-amber-900' 
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              📦 Capacité ({crateRequests.length})
            </button>
          </div>
        )}

        {/* Liste des demandes */}
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-amber-700">Chargement...</div>
          ) : (
            <div className="divide-y divide-amber-300">
              {/* Demandes de véhicules */}
              {filteredVehicleRequests.map(request => (
                <div key={`vehicle-${request.id}`} className="p-3 bg-cyan-50 hover:bg-cyan-100">
                  <div className="flex items-start gap-2">
                    <span className="text-xl">🚢</span>
                    <div className="flex-1">
                      <div className="font-medium text-cyan-900">
                        {request.username} demande un véhicule
                      </div>
                      <div className="text-sm text-cyan-700">
                        <span className="font-medium">"{request.vehicleName}"</span>
                        <span className="text-cyan-600"> - {request.maxCrates} cagette{request.maxCrates > 1 ? 's' : ''} max</span>
                      </div>
                      {request.reason && (
                        <div className="text-xs text-cyan-600 mt-1 italic">
                          "{request.reason}"
                        </div>
                      )}
                      <div className="text-xs text-cyan-500 mt-1">
                        {new Date(request.createdAt).toLocaleString('fr-FR')}
                      </div>
                    </div>
                  </div>
                  
                  {/* Boutons d'action */}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleApproveVehicle(request.id)}
                      disabled={processing === request.id}
                      className="flex-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      <span>✓</span>
                      <span>Créer le véhicule</span>
                    </button>
                    <button
                      onClick={() => handleRejectVehicle(request.id)}
                      disabled={processing === request.id}
                      className="flex-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      <span>✕</span>
                      <span>Refuser</span>
                    </button>
                  </div>
                </div>
              ))}

              {/* Demandes de capacité */}
              {filteredCrateRequests.map(request => (
                <div key={`crate-${request.id}`} className="p-3 bg-white/50 hover:bg-amber-50">
                  <div className="flex items-start gap-2">
                    <span className="text-xl">📦</span>
                    <div className="flex-1">
                      <div className="font-medium text-amber-900">
                        {request.username} demande +{request.requestedSlots} slot{request.requestedSlots > 1 ? 's' : ''}
                      </div>
                      <div className="text-sm text-amber-700">
                        Pour <span className="font-medium">{request.vehicle?.name || 'véhicule inconnu'}</span>
                        {request.vehicle?.maxCrates && (
                          <span className="text-amber-600"> (actuellement {request.vehicle.maxCrates} max)</span>
                        )}
                      </div>
                      {request.reason && (
                        <div className="text-xs text-amber-600 mt-1 italic">
                          "{request.reason}"
                        </div>
                      )}
                      <div className="text-xs text-amber-500 mt-1">
                        {new Date(request.createdAt).toLocaleString('fr-FR')}
                      </div>
                    </div>
                  </div>
                  
                  {/* Boutons d'action */}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleApproveCrate(request.id)}
                      disabled={processing === request.id}
                      className="flex-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      <span>✓</span>
                      <span>Approuver</span>
                    </button>
                    <button
                      onClick={() => handleRejectCrate(request.id)}
                      disabled={processing === request.id}
                      className="flex-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      <span>✕</span>
                      <span>Refuser</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
