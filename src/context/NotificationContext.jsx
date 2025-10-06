import { createContext, useContext, useState, useCallback } from "react";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((data) => {
    const id = Date.now() + Math.random();
    const notification = { ...data, id };
    
    console.log("[NotificationContext] 🔔 NOUVELLE NOTIFICATION CRÉÉE:", {
      id: id,
      type: data.type,
      player: data.player,
      result: data.result,
      notation: data.notation,
      diceType: data.diceType,
      source: "NotificationContext",
      hasNotation: !!data.notation,
      stackTrace: new Error().stack?.split('\n').slice(1, 4).join('\n')
    });
    
    setNotifications(prev => {
      const newNotifications = [...prev, notification];
      console.log("[NotificationContext] 📋 TOTAL NOTIFICATIONS:", newNotifications.length);
      return newNotifications;
    });
    
    // Auto-suppression après 8 secondes pour les dés (plus long pour les critiques)
    const duration = data.type === 'dice' ? 8000 : 5000;
    setTimeout(() => {
      console.log("[NotificationContext] ⏰ Auto-suppression notification:", id);
      hideNotification(id);
    }, duration);
  }, []);

  const hideNotification = useCallback((id) => {
    if (id) {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    } else {
      setNotifications([]);
    }
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, showNotification, hideNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotification doit être utilisé dans NotificationProvider");
  return context;
};
