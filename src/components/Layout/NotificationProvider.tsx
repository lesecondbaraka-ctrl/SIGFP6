import React, { useState } from 'react';
import { NotificationContext, NotificationType } from './NotificationContext';

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);

  const showNotification = (notification: Omit<NotificationType, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const duration = notification.duration || 5000;

    setNotifications(prev => [...prev, { ...notification, id }]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`px-4 py-3 rounded-lg shadow-lg transform transition-all duration-500 ease-in-out translate-y-0 opacity-100
              ${notification.type === 'success' && 'bg-green-500 text-white'}
              ${notification.type === 'error' && 'bg-red-500 text-white'}
              ${notification.type === 'warning' && 'bg-yellow-500 text-white'}
              ${notification.type === 'info' && 'bg-blue-500 text-white'}
            `}
            style={{ animation: 'slideIn 0.5s ease-out' }}
          >
            <div className="flex items-center">
              {notification.type === 'success' && (
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {notification.type === 'error' && (
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {notification.type === 'warning' && (
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              {notification.type === 'info' && (
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <p>{notification.message}</p>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};