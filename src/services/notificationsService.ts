import api from './api';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  url: string | null;
  read: boolean;
  data: any;
  createdAt: string;
}

export interface NotificationSettings {
  id: string;
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  notifyOnAssignment: boolean;
  notifyOnMention: boolean;
  notifyOnDeadline: boolean;
  notifyOnStatusChange: boolean;
}

class NotificationsService {
  async getNotifications(limit?: number, offset?: number): Promise<Notification[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    
    const response = await api.get(`/notifications?${params.toString()}`) as any;
    return response.data;
  }

  async getUnreadCount(): Promise<number> {
    const response = await api.get('/notifications/unread-count') as any;
    return response.data.count;
  }

  async markAsRead(id: string): Promise<void> {
    await api.put(`/notifications/${id}/read`);
  }

  async markAllAsRead(): Promise<void> {
    await api.put('/notifications/read-all');
  }

  async deleteNotification(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
  }

  async getSettings(): Promise<NotificationSettings> {
    const response = await api.get('/notifications/settings') as any;
    return response.data;
  }

  async updateSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    const response = await api.put('/notifications/settings', settings) as any;
    return response.data;
  }
}

export const notificationsService = new NotificationsService();
