<script lang="ts" setup>
import { register } from '@/api/login'
import { LOGIN_PAGE } from '@/router/config'

definePage({
  style: {
    navigationBarTitleText: '注册',
  },
})

const form = reactive({
  username: '',
  password: '',
})
const submitting = ref(false)

async function doRegister() {
  if (!form.username.trim() || !form.password) {
    uni.showToast({ title: '请输入用户名和密码', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    await register({
      username: form.username.trim(),
      password: form.password,
    })
    uni.showToast({ title: '注册成功，请登录', icon: 'success' })
    uni.redirectTo({ url: LOGIN_PAGE })
  }
  catch (error) {
    console.log('注册失败', error)
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <view class="login px-6 pt-16">
    <view class="mb-8 text-center text-6 text-gray-800">
      注册
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
        @confirm="doRegister"
      >
    </view>
    <button
      class="w-full"
      type="primary"
      :loading="submitting"
      :disabled="submitting"
      @click="doRegister"
    >
      注册
    </button>
  </view>
</template>
