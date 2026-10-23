<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthBrandPanel from '@/components/organisms/AuthBrandPanel.vue'
import AuthTemplate from '@/components/templates/AuthTemplate.vue'
import AuthForm from './components/AuthForm.vue'
import { login, register } from './auth.service'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const error = ref('')
const mode = computed(
  () => (route.name === 'register' ? 'register' : 'login') as 'login' | 'register',
)

const handleSubmit = async (payload: {
  identifier: string
  username?: string
  email?: string
  password: string
  role?: 'owner' | 'cashier'
}) => {
  loading.value = true
  error.value = ''
  try {
    if (mode.value === 'login') {
      const session = await login({ identifier: payload.identifier, password: payload.password })
      await router.push({ name: session.role === 'owner' ? 'dashboard' : 'cashier' })
    } else if (payload.username && payload.email) {
      await register({
        username: payload.username,
        email: payload.email,
        password: payload.password,
        role: payload.role || 'owner',
      })
      await router.push({ name: 'login', query: { registered: '1' } })
    }
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : 'Autentikasi gagal. Silakan coba lagi.'
  } finally {
    loading.value = false
  }
}

const switchMode = () => {
  error.value = ''
  router.push({ name: mode.value === 'login' ? 'register' : 'login' })
}
</script>

<template>
  <AuthTemplate>
    <template #brand><AuthBrandPanel /></template>
    <AuthForm
      :mode="mode"
      :loading="loading"
      :error="error"
      @submit="handleSubmit"
      @switch-mode="switchMode"
    />
  </AuthTemplate>
</template>
