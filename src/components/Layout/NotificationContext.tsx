import React from 'react';

export interface NotificationType {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export const NotificationContext = React.createContext<{
  showNotification: (notification: Omit<NotificationType, 'id'>) => void;
}>({
  showNotification: () => {},
});