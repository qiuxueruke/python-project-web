import { http } from '@/http/http'

export interface INotification {
  id: number
  userId: number
  title: string
  content: string
  isRead: boolean
  createdAt?: string
}

export interface INotificationCreate {
  userId: number
  title: string
  content: string
}

interface IBackendNotification {
  id: number
  user_id?: number
  userId?: number
  title: string
  content: string
  is_read?: number
  isRead?: number | boolean
  created_at?: string
  createdAt?: string
}

function toNotification(item: IBackendNotification): INotification {
  return {
    id: item.id,
    userId: item.userId ?? item.user_id ?? 0,
    title: item.title,
    content: item.content,
    isRead: Boolean(item.isRead ?? item.is_read),
    createdAt: item.createdAt ?? item.created_at,
  }
}

export function listNotifications() {
  return http.get<IBackendNotification[]>('/notifications').then(items => (items || []).map(toNotification))
}

export function createNotification(data: INotificationCreate) {
  return http.post<IBackendNotification>('/notifications', {
    user_id: data.userId,
    title: data.title,
    content: data.content,
  }).then(toNotification)
}

export function markNotificationRead(notificationId: number) {
  return http.post<IBackendNotification>(`/notifications/${notificationId}/read`).then(toNotification)
}
