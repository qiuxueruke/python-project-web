<script lang="ts" setup>
import { REGISTER_PAGE } from '@/router/config'
import { useTokenStore } from '@/store/token'

definePage({
  style: {
    navigationBarTitleText: '登录',
  },
})

const tokenStore = useTokenStore()
const form = reactive({
  username: 'demo',
  password: '123456',
})
const submitting = ref(false)

async function doLogin() {
  if (!form.username.trim() || !form.password) {
    uni.showToast({ title: '请输入用户名和密码', icon: 'none' })
    return
  }
  if (tokenStore.hasLogin) {
    uni.navigateBack()
    return
  }
  submitting.value = true
  try {
    await tokenStore.login({
      username: form.username.trim(),
      password: form.password,
    })
    uni.navigateBack()
  }
  catch (error) {
    console.log('登录失败', error)
  }
  finally {
    submitting.value = false
  }
}

function goRegister() {
  uni.navigateTo({ url: REGISTER_PAGE })
}
</script>

<template>
  <view class="login px-6 pt-16">
    <view class="mb-8 text-center text-6 text-gray-800">
      登录
    </view>
    <view class="mb-4">
      <input
        v-model="form.username"
        class="h-11 rounded-2 bg-gray-100 px-3"
        placeholder="用户名"
        confirm-type="next"
      >
    </view>
    <view class="mb-6">
      <input
        v-model="form.password"
        class="h-11 rounded-2 bg-gray-100 px-3"
        password
        placeholder="密码"
        confirm-type="done"
        @confirm="doLogin"
      >
    </view>
    <button
      class="w-full"
      type="primary"
      :loading="submitting"
      :disabled="submitting"
      @click="doLogin"
    >
      登录
    </button>
    <view class="mt-4 text-center text-gray-500" @click="goRegister">
      没有账号？去注册
    </view>
  </view>
</template>
