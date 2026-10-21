<script lang="ts" setup>
import type { INotification } from '@/api/notifications'
import { listNotifications } from '@/api/notifications'
import { LOGIN_PAGE } from '@/router/config'
import { useUserStore } from '@/store'
import { useTokenStore } from '@/store/token'

definePage({
  type: 'home',
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '首页',
  },
})

const tokenStore = useTokenStore()
const userStore = useUserStore()
const notifications = ref<INotification[]>([])

function plainText(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

const unread = computed(() => notifications.value.filter(item => !item.isRead).length)
const latest = computed(() => notifications.value.slice(0, 3))
const greetingName = computed(() => userStore.userInfo.nickname || userStore.userInfo.username || '用户')

async function loadNotifications() {
  if (!tokenStore.hasLogin) {
    notifications.value = []
    return
  }
  try {
    notifications.value = await listNotifications()
  }
  catch (error) {
    console.log('加载通知失败', error)
  }
}

onShow(() => {
  loadNotifications()
})

function goChat() {
  uni.switchTab({ url: '/pages/chat/index' })
}

function goMe() {
  uni.switchTab({ url: '/pages/me/me' })
}

function goLogin() {
  uni.navigateTo({ url: LOGIN_PAGE })
}
</script>

<template>
  <view class="bg-gray-50 px-4 pb-6 pt-safe">
    <view class="pt-6">
      <view class="text-5 text-gray-900 font-semibold">
        {{ tokenStore.hasLogin ? `你好，${greetingName}` : '你好' }}
      </view>
      <view class="mt-1 text-3 text-gray-500">
        查看通知、进入聊天
      </view>
    </view>

    <view class="grid grid-cols-3 mt-4 gap-3">
      <view class="rounded-3 bg-white py-3 text-center" @click="goChat">
        <view class="i-carbon-chat mx-auto text-6 text-primary" />
        <view class="mt-1 text-3">聊天</view>
      </view>
      <view class="relative rounded-3 bg-white py-3 text-center" @click="goMe">
        <view class="i-carbon-notification mx-auto text-6 text-primary" />
        <view class="mt-1 text-3">通知</view>
        <view v-if="unread" class="absolute right-3 top-2 min-w-4 rounded-full bg-red-500 px-1 text-2.5 text-white">
          {{ unread > 99 ? '99+' : unread }}
        </view>
      </view>
      <view class="rounded-3 bg-white py-3 text-center" @click="goMe">
        <view class="i-carbon-user mx-auto text-6 text-primary" />
        <view class="mt-1 text-3">我的</view>
      </view>
    </view>

    <view class="mt-4 rounded-3 bg-white p-3">
      <view class="mb-2 flex items-center justify-between">
        <text class="text-4 text-gray-800">最新通知</text>
        <text v-if="tokenStore.hasLogin" class="text-3 text-primary" @click="goMe">全部</text>
      </view>
      <view v-if="!tokenStore.hasLogin" class="py-4 text-center">
        <view class="mb-3 text-3 text-gray-400">登录后查看管理员发布的通知</view>
        <button size="mini" type="primary" @click="goLogin">去登录</button>
      </view>
      <view v-else-if="!latest.length" class="py-4 text-center text-3 text-gray-400">
        暂无通知
      </view>
      <view
        v-for="item in latest"
        :key="item.id"
        class="mb-2 border-b border-gray-100 pb-2 last:mb-0 last:border-0"
        @click="goMe"
      >
        <view class="flex items-center justify-between">
          <text class="text-3.5 text-gray-800">{{ item.title }}</text>
          <text class="text-2.5" :class="item.isRead ? 'text-gray-400' : 'text-primary'">
            {{ item.isRead ? '已读' : '未读' }}
          </text>
        </view>
        <view class="line-clamp-2 mt-1 text-3 text-gray-500">
          {{ plainText(item.content) }}
        </view>
      </view>
    </view>
  </view>
</template>
