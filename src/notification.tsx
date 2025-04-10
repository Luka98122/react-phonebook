import React, { createContext, useContext, useState, useEffect } from "react";
import "../styles/notifications.css"; // Style separately!

type Notification = {
  id: number;
  message: string;
};

type NotificationContextType = {
  notify: (message: string) => void;
};

const NotificationContext = createContext<NotificationContextType>({
  notify: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

let idCounter = 0;

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = (message: string) => {
    const id = idCounter++;
    setNotifications((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <div className="notification-container">
        {notifications.map((n) => (
          <div key={n.id} className="notification">
            <p>{n.message}</p>
            <div className="progress-bar" />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
