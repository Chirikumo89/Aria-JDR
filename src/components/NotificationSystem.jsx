import { useState, useEffect } from 'react';

const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([]);

  // Fonction pour ajouter une notification
  const addNotification = (type, message, duration = 5000) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      type, // 'success', 'error', 'warning', 'info'
      message,
      duration
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-suppression après la durée spécifiée
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  };

  // Fonction pour supprimer une notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  // Fonction pour supprimer toutes les notifications
  const clearAll = () => {
    setNotifications([]);
  };

  // Exposer les fonctions globalement
  useEffect(() => {
    window.notificationSystem = {
      success: (message, duration) => addNotification('success', message, duration),
      error: (message, duration) => addNotification('error', message, duration),
      warning: (message, duration) => addNotification('warning', message, duration),
      info: (message, duration) => addNotification('info', message, duration),
      clear: clearAll
    };

    return () => {
      delete window.notificationSystem;
    };
  }, []);

  const getNotificationStyles = (type) => {
    const baseStyles = "p-4 rounded-lg shadow-lg border-l-4 mb-2 transition-all duration-300 transform";
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-green-400 text-green-800`;
      case 'error':
        return `${baseStyles} bg-red-50 border-red-400 text-red-800`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-yellow-400 text-yellow-800`;
      case 'info':
        return `${baseStyles} bg-blue-50 border-blue-400 text-blue-800`;
      default:
        return `${baseStyles} bg-gray-50 border-gray-400 text-gray-800`;
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={getNotificationStyles(notification.type)}
          style={{
            animation: 'slideInRight 0.3s ease-out'
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <span className="text-lg">{getIcon(notification.type)}</span>
              <div className="flex-1">
                <p className="text-sm font-medium">{notification.message}</p>
              </div>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <span className="sr-only">Fermer</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationSystem;
