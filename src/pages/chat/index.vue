<script lang="ts" setup>
import type { IChatUser } from '@/api/chat'
import { listChatUsers } from '@/api/chat'
import { LOGIN_PAGE } from '@/router/config'
import { useTokenStore } from '@/store/token'

definePage({
  style: {
    navigationBarTitleText: '聊天',
  },
})

const tokenStore = useTokenStore()
const users = ref<IChatUser[]>([])
const loading = ref(false)

async function loadUsers() {
  if (!tokenStore.updateNowTime().hasLogin) {
    users.value = []
    return
  }
  loading.value = true
  try {
    users.value = await listChatUsers()
  }
  catch (error) {
    console.log('加载聊天用户失败', error)
  }
  finally {
    loading.value = false
  }
}

function goLogin() {
  uni.navigateTo({ url: LOGIN_PAGE })
}

function openRoom(user: IChatUser) {
  const name = user.nickname || user.username
  uni.navigateTo({
    url: `/pages/chat/room?peerId=${user.id}&name=${name}`,
  })
}

onShow(() => {
  void loadUsers()
})
</script>

<template>
  <view class="min-h-screen bg-white px-3 pt-3">
    <view class="mb-3 text-3 text-gray-500">
      用两个账号分别登录（demo / demo2，密码 123456），即可互相发消息。
    </view>
    <view v-if="!tokenStore.hasLogin" class="py-8 text-center">
      <view class="mb-4 text-gray-400">
        登录后才能聊天
      </view>
      <button type="primary" class="w-40" @click="goLogin">
        去登录
      </button>
    </view>
    <view v-else-if="loading" class="py-8 text-center text-gray-400">
      加载中...
    </view>
    <view v-else-if="!users.length" class="py-8 text-center text-gray-400">
      还没有其他用户
    </view>
    <view
      v-for="user in users"
      :key="user.id"
      class="mb-2 flex items-center rounded-2 bg-gray-50 p-3"
      @click="openRoom(user)"
    >
      <image
        :src="user.avatar || '/static/images/default-avatar.png'"
        class="h-12 w-12 rounded-full bg-gray-200"
        mode="aspectFill"
      />
      <view class="ml-3 min-w-0 flex-1">
        <view class="truncate text-4 text-gray-800">
          {{ user.nickname || user.username }}
        </view>
        <view class="mt-1 text-3 text-gray-400">
          {{ user.username }}
        </view>
      </view>
      <view class="text-3" :class="user.online ? 'text-primary' : 'text-gray-400'">
        {{ user.online ? '在线' : '离线' }}
      </view>
    </view>
  </view>
</template>
