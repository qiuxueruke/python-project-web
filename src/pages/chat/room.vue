<script lang="ts" setup>
import type { IChatMessage } from '@/api/chat'
import { buildChatSocketUrl, listChatMessages } from '@/api/chat'
import { useTokenStore } from '@/store/token'
import { useUserStore } from '@/store/user'

definePage({
  style: {
    navigationBarTitleText: '会话',
  },
})

const tokenStore = useTokenStore()
const userStore = useUserStore()
const peerId = ref(0)
const peerName = ref('会话')
const peerOnline = ref(false)
const messages = ref<IChatMessage[]>([])
const draft = ref('')
const statusText = ref('未连接')
const anchor = ref('')
let socket: UniApp.SocketTask | null = null
let closedByPage = false
let reconnectTimer: ReturnType<typeof setTimeout> | undefined

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  const hh = `${date.getHours()}`.padStart(2, '0')
  const mm = `${date.getMinutes()}`.padStart(2, '0')
  return `${hh}:${mm}`
}

function updateTitle() {
  const state = peerOnline.value ? '在线' : '离线'
  uni.setNavigationBarTitle({ title: `${peerName.value} · ${state}` })
}

function scrollToLatest() {
  const last = messages.value[messages.value.length - 1]
  anchor.value = ''
  if (!last) {
    return
  }
  nextTick(() => {
    anchor.value = `msg-${last.id}`
  })
}

function appendMessage(message: IChatMessage) {
  if (message.senderId !== peerId.value && message.receiverId !== peerId.value) {
    return
  }
  if (messages.value.some(item => item.id === message.id)) {
    return
  }
  messages.value.push(message)
  scrollToLatest()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readNumber(record: Record<string, unknown>, key: string) {
  const value = record[key]
  return typeof value === 'number' ? value : undefined
}

function handleFrame(raw: string) {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  }
  catch {
    return
  }
  if (!isRecord(parsed) || typeof parsed.type !== 'string') {
    return
  }
  if (parsed.type === 'ready') {
    const onlineIds = Array.isArray(parsed.online_user_ids)
      ? parsed.online_user_ids.filter((id): id is number => typeof id === 'number')
      : []
    peerOnline.value = onlineIds.includes(peerId.value)
    updateTitle()
    return
  }
  if (parsed.type === 'presence') {
    const userId = readNumber(parsed, 'user_id')
    if (userId === peerId.value) {
      peerOnline.value = Boolean(parsed.online)
      updateTitle()
    }
    return
  }
  if (parsed.type === 'error') {
    const message = typeof parsed.message === 'string' ? parsed.message : '发送失败'
    uni.showToast({ title: message, icon: 'none' })
    return
  }
  if (parsed.type === 'message') {
    const id = readNumber(parsed, 'id')
    const senderId = readNumber(parsed, 'sender_id')
    const receiverId = readNumber(parsed, 'receiver_id')
    if (id === undefined || senderId === undefined || receiverId === undefined) {
      return
    }
    if (typeof parsed.content !== 'string') {
      return
    }
    appendMessage({
      id,
      senderId,
      receiverId,
      content: parsed.content,
      createdAt: typeof parsed.created_at === 'string' ? parsed.created_at : '',
    })
  }
}

function clearReconnect() {
  if (reconnectTimer !== undefined) {
    clearTimeout(reconnectTimer)
    reconnectTimer = undefined
  }
}

function scheduleReconnect() {
  clearReconnect()
  if (closedByPage) {
    return
  }
  statusText.value = '已断开，正在重连'
  reconnectTimer = setTimeout(() => {
    connect()
  }, 2000)
}

function connect() {
  const token = tokenStore.updateNowTime().validToken
  if (!token || closedByPage) {
    statusText.value = '未登录'
    return
  }
  clearReconnect()
  if (socket) {
    const previous = socket
    socket = null
    previous.close({})
  }
  statusText.value = '连接中'
  const task = uni.connectSocket({
    url: buildChatSocketUrl(token),
    complete: () => {},
  })
  socket = task
  task.onOpen(() => {
    if (socket === task) {
      statusText.value = '已连接'
    }
  })
  task.onMessage((event) => {
    const data = event.data
    if (typeof data === 'string') {
      handleFrame(data)
    }
  })
  task.onClose((event) => {
    const current = socket === task
    if (current) {
      socket = null
    }
    if (closedByPage || !current) {
      return
    }
    if (event.code === 1008) {
      closedByPage = true
      statusText.value = '登录已失效'
      uni.showToast({ title: '登录已失效，请重新登录', icon: 'none' })
      return
    }
    scheduleReconnect()
  })
  task.onError(() => {
    if (socket === task) {
      statusText.value = '连接失败'
    }
  })
}

async function loadHistory() {
  if (!peerId.value) {
    return
  }
  try {
    messages.value = await listChatMessages(peerId.value)
    scrollToLatest()
  }
  catch (error) {
    console.log('加载聊天记录失败', error)
  }
}

function sendMessage() {
  const content = draft.value.trim()
  if (!content) {
    return
  }
  if (content.length > 2000) {
    uni.showToast({ title: '消息不能超过 2000 字', icon: 'none' })
    return
  }
  if (!socket || statusText.value !== '已连接') {
    uni.showToast({ title: '聊天连接未就绪', icon: 'none' })
    return
  }
  socket.send({
    data: JSON.stringify({
      type: 'message',
      receiver_id: peerId.value,
      content,
    }),
    fail: () => {
      uni.showToast({ title: '发送失败', icon: 'none' })
    },
  })
  draft.value = ''
}

function isMine(message: IChatMessage) {
  return message.senderId === userStore.userInfo.userId
}

onLoad((query) => {
  peerId.value = Number(query?.peerId || 0)
  const rawName = query?.name ? decodeURIComponent(query.name) : ''
  peerName.value = rawName || '会话'
  updateTitle()
  void loadHistory()
  connect()
})

onUnload(() => {
  closedByPage = true
  clearReconnect()
  socket?.close({})
  socket = null
})
</script>

<template>
  <view class="chat-page bg-white">
    <scroll-view scroll-y class="chat-scroll box-border bg-gray-100 px-3 pt-3" :scroll-into-view="anchor" scroll-with-animation>
      <view v-if="!messages.length" class="py-10 text-center text-3 text-gray-400">
        还没有消息，发一句打个招呼
      </view>
      <view
        v-for="message in messages"
        :id="`msg-${message.id}`"
        :key="message.id"
        class="mb-3 flex"
        :class="isMine(message) ? 'justify-end' : 'justify-start'"
      >
        <view class="max-w-[70%]">
          <view
            class="rounded-2 px-3 py-2 text-3.5 leading-snug"
            :class="isMine(message) ? 'bg-primary text-white' : 'bg-white text-gray-800'"
          >
            {{ message.content }}
          </view>
          <view
            class="mt-1 text-2xs text-gray-400"
            :class="isMine(message) ? 'text-right' : 'text-left'"
          >
            {{ formatTime(message.createdAt) }}
          </view>
        </view>
      </view>
    </scroll-view>
    <view class="border-t border-gray-200 bg-white px-3 py-2 pb-safe">
      <view class="mb-1 text-2xs text-gray-400">
        {{ statusText }}
      </view>
      <view class="flex items-center gap-2">
        <input
          v-model="draft"
          class="h-9 flex-1 rounded-full bg-gray-100 px-3 text-3.5"
          confirm-type="send"
          placeholder="输入消息"
          @confirm="sendMessage"
        >
        <view class="h-9 w-16 center rounded-full bg-primary text-3 text-white" @click="sendMessage">
          发送
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.chat-page {
  position: fixed;
  top: var(--window-top, 0px);
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.chat-scroll {
  box-sizing: border-box;
  flex: 1;
  width: 100%;
  height: 1px;
}
</style>
