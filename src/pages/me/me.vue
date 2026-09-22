<script lang="ts" setup>
import type { INotification } from '@/api/notifications'
import type { IUserInfoRes } from '@/api/types/login'
import { storeToRefs } from 'pinia'
import { createNotification, listNotifications, markNotificationRead } from '@/api/notifications'
import { LOGIN_PAGE } from '@/router/config'
import { useUserStore } from '@/store'
import { useTokenStore } from '@/store/token'
import { uploadFileUrl, useUpload } from '@/utils/uploadFile'

definePage({
  style: {
    navigationBarTitleText: '我的',
  },
})

const userStore = useUserStore()
const tokenStore = useTokenStore()
const { userInfo } = storeToRefs(userStore)
const notifications = ref<INotification[]>([])
const loadingNotifications = ref(false)
const { loading: uploadingAvatar, run: chooseAndUploadAvatar } = useUpload<IUserInfoRes>(
  uploadFileUrl.USER_AVATAR,
  {},
  {
    maxSize: 5,
    onSuccess: (res) => {
      const user = res as IUserInfoRes
      if (user?.userId) {
        userStore.setUserInfo(user)
      }
      else if (user?.avatar) {
        userStore.setUserAvatar(user.avatar)
      }
      uni.showToast({ title: '头像已更新', icon: 'success' })
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : '头像上传失败'
      uni.showToast({ title: message, icon: 'none' })
    },
  },
)

async function loadNotifications() {
  if (!tokenStore.hasLogin) {
    notifications.value = []
    return
  }
  loadingNotifications.value = true
  try {
    notifications.value = await listNotifications()
  }
  catch (error) {
    console.log('加载通知失败', error)
  }
  finally {
    loadingNotifications.value = false
  }
}

onShow(() => {
  loadNotifications()
})

async function handleLogin() {
  // #ifdef MP-WEIXIN
  await tokenStore.wxLogin()
  await loadNotifications()
  // #endif
  // #ifndef MP-WEIXIN
  uni.navigateTo({
    url: LOGIN_PAGE,
  })
  // #endif
}

function handleLogout() {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: async (res) => {
      if (res.confirm) {
        await useTokenStore().logout()
        notifications.value = []
        uni.showToast({
          title: '退出登录成功',
          icon: 'success',
        })
      }
    },
  })
}

async function handleSendTestNotification() {
  if (!tokenStore.hasLogin) {
    return
  }
  try {
    await createNotification({
      userId: userInfo.value.userId,
      title: '测试通知',
      content: `前后端接口已打通 ${new Date().toLocaleString()}`,
    })
    await loadNotifications()
    uni.showToast({ title: '已发送', icon: 'success' })
  }
  catch (error) {
    console.log('发送通知失败', error)
  }
}

async function handleRead(item: INotification) {
  if (item.isRead) {
    return
  }
  try {
    const updated = await markNotificationRead(item.id)
    notifications.value = notifications.value.map(current => current.id === updated.id ? updated : current)
  }
  catch (error) {
    console.log('标记已读失败', error)
  }
}

function handleAvatarClick() {
  if (!tokenStore.hasLogin) {
    handleLogin()
    return
  }
  if (uploadingAvatar.value) {
    return
  }
  chooseAndUploadAvatar()
}
</script>

<template>
  <view class="profile-container px-3 pb-safe">
    <view class="mt-6 flex flex-col items-center" @click="handleAvatarClick">
      <image
        :src="userInfo.avatar"
        class="h-24 w-24 rounded-full bg-gray-100"
        mode="aspectFill"
      />
      <view class="mt-2 text-3 text-gray-500">
        {{ tokenStore.hasLogin ? (uploadingAvatar ? '上传中...' : '点击更换头像') : '登录后可更换头像' }}
      </view>
    </view>
    <view class="mt-3 break-all text-center text-green-500">
      {{ tokenStore.hasLogin ? '已登录' : '未登录' }}
    </view>
    <view class="mt-3 break-all rounded-2 bg-gray-50 p-3 text-3">
      {{ JSON.stringify(userInfo, null, 2) }}
    </view>

    <view v-if="tokenStore.hasLogin" class="mt-4">
      <view class="mb-2 flex items-center justify-between">
        <text class="text-4 text-gray-800">通知</text>
        <text class="text-3 text-primary" @click="handleSendTestNotification">发一条测试通知</text>
      </view>
      <view v-if="loadingNotifications" class="py-4 text-center text-gray-400">
        加载中...
      </view>
      <view v-else-if="!notifications.length" class="py-4 text-center text-gray-400">
        暂无通知
      </view>
      <view
        v-for="item in notifications"
        :key="item.id"
        class="mb-2 rounded-2 bg-gray-50 p-3"
        @click="handleRead(item)"
      >
        <view class="flex items-center justify-between">
          <text class="text-3.5 text-gray-800">{{ item.title }}</text>
          <text class="text-2.5" :class="item.isRead ? 'text-gray-400' : 'text-primary'">
            {{ item.isRead ? '已读' : '未读' }}
          </text>
        </view>
        <view class="mt-1 text-3 text-gray-500">
          {{ item.content }}
        </view>
      </view>
    </view>

    <view class="mt-10 px-3">
      <view class="m-auto w-160px text-center">
        <button v-if="tokenStore.hasLogin" type="warn" class="w-full" @click="handleLogout">
          退出登录
        </button>
        <button v-else type="primary" class="w-full" @click="handleLogin">
          登录
        </button>
      </view>
    </view>
  </view>
</template>
