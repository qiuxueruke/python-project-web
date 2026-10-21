import { http } from '@/http/http'
import { getEnvBaseUrl } from '@/utils'

export interface IChatUser {
  id: number
  username: string
  nickname: string
  avatar?: string
  online: boolean
}

export interface IChatMessage {
  id: number
  senderId: number
  receiverId: number
  content: string
  createdAt: string
}

interface IBackendChatUser {
  id: number
  username: string
  nickname?: string | null
  avatar?: string | null
  online?: boolean
}

interface IBackendChatMessage {
  id: number
  sender_id?: number
  senderId?: number
  receiver_id?: number
  receiverId?: number
  content: string
  created_at?: string
  createdAt?: string
}

function toChatUser(item: IBackendChatUser): IChatUser {
  return {
    id: item.id,
    username: item.username,
    nickname: item.nickname || item.username,
    avatar: item.avatar || undefined,
    online: Boolean(item.online),
  }
}

function toChatMessage(item: IBackendChatMessage): IChatMessage {
  return {
    id: item.id,
    senderId: item.senderId ?? item.sender_id ?? 0,
    receiverId: item.receiverId ?? item.receiver_id ?? 0,
    content: item.content,
    createdAt: item.createdAt ?? item.created_at ?? '',
  }
}

export function listChatUsers() {
  return http.get<IBackendChatUser[]>('/chat/users').then(items => (items || []).map(toChatUser))
}

export function listChatMessages(peerId: number) {
  return http.get<IBackendChatMessage[]>('/chat/messages', { peer_id: peerId }).then(items => (items || []).map(toChatMessage))
}

/** 把 HTTP API 根地址换成 WebSocket 地址，token 放在 query 上。 */
export function buildChatSocketUrl(token: string) {
  const httpBase = getEnvBaseUrl().replace(/\/$/, '')
  const wsBase = httpBase.replace(/^http/i, 'ws')
  return `${wsBase}/chat/ws?token=${encodeURIComponent(token)}`
}
