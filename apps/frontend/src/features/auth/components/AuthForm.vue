<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-vue-next'
import AppButton from '@/components/atoms/AppButton.vue'
import AppInput from '@/components/atoms/AppInput.vue'
import FormField from '@/components/molecules/FormField.vue'

type AuthMode = 'login' | 'register'
const props = withDefaults(defineProps<{ mode: AuthMode; loading?: boolean; error?: string }>(), {
  loading: false,
  error: '',
})
const emit = defineEmits<{
  submit: [payload: { identifier: string; username?: string; email?: string; password: string }]
  switchMode: []
}>()
const identifier = ref('')
const username = ref('')
const email = ref('')
const password = ref('')
const role = ref<'owner' | 'cashier'>('owner')
const showPassword = ref(false)
const submitted = ref(false)
const isRegister = computed(() => props.mode === 'register')
const title = computed(() => (isRegister.value ? 'Buat akses baru' : 'Selamat datang kembali'))
const subtitle = computed(() =>
  isRegister.value
    ? 'Daftar sebagai Pemilik Toko (Owner) atau Staf Kasir.'
    : 'Masuk untuk melanjutkan operasional toko hari ini.',
)
const submit = () => {
  submitted.value = true
  const hasMissingField = isRegister.value
    ? !username.value || !email.value || !password.value
    : !identifier.value || !password.value
  if (hasMissingField) return
  emit('submit', {
    identifier: isRegister.value ? email.value : identifier.value,
    ...(isRegister.value ? { username: username.value, email: email.value, role: role.value } : {}),
    password: password.value,
  })
}
</script>

<template>
  <div>
    <div class="mb-9">
      <p class="mb-3 text-[.7rem] font-extrabold uppercase tracking-[.12em] text-amber-700">
        {{ isRegister ? 'Team access' : 'Cashier workspace' }}
      </p>
      <h2
        class="mb-2.5 text-[clamp(1.8rem,3vw,2.4rem)] font-extrabold tracking-[-.045em] text-slate-900"
      >
        {{ title }}
      </h2>
      <p class="text-[.92rem] text-slate-600">{{ subtitle }}</p>
    </div>

    <div
      v-if="error"
      class="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs text-rose-700"
      role="alert"
    >
      {{ error }}
    </div>

    <form class="grid gap-5" @submit.prevent="submit">
      <FormField
        v-if="isRegister"
        label="Username"
        for-id="username"
        :error="submitted && !username ? 'Username wajib diisi.' : undefined"
      >
        <div
          class="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3 transition focus-within:border-amber-700 focus-within:shadow-[0_0_0_3px_rgba(180,83,9,.11)]"
        >
          <UserRound :size="18" class="shrink-0 text-slate-400" aria-hidden="true" />
          <AppInput
            id="username"
            v-model="username"
            placeholder="Contoh: rani.pratama"
            autocomplete="username"
          />
        </div>
      </FormField>

      <FormField
        :label="isRegister ? 'Email kerja' : 'Username atau email'"
        :for-id="isRegister ? 'email' : 'identifier'"
        :error="
          submitted && !(isRegister ? email : identifier) ? 'Field ini wajib diisi.' : undefined
        "
      >
        <div
          class="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3 transition focus-within:border-amber-700 focus-within:shadow-[0_0_0_3px_rgba(180,83,9,.11)]"
        >
          <Mail :size="18" class="shrink-0 text-slate-400" aria-hidden="true" />
          <AppInput
            :id="isRegister ? 'email' : 'identifier'"
            :type="isRegister ? 'email' : 'text'"
            :model-value="isRegister ? email : identifier"
            :placeholder="isRegister ? 'nama@retailflow.id' : 'budi.santoso atau email'"
            :autocomplete="isRegister ? 'email' : 'username'"
            @update:model-value="(value) => (isRegister ? (email = value) : (identifier = value))"
          />
        </div>
      </FormField>

      <FormField
        label="Kata sandi"
        for-id="password"
        :hint="!isRegister ? 'Minimal 8 karakter' : undefined"
        :error="submitted && !password ? 'Kata sandi wajib diisi.' : undefined"
      >
        <div
          class="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3 transition focus-within:border-amber-700 focus-within:shadow-[0_0_0_3px_rgba(180,83,9,.11)]"
        >
          <LockKeyhole :size="18" class="shrink-0 text-slate-400" aria-hidden="true" />
          <AppInput
            id="password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Masukkan kata sandi"
            :autocomplete="isRegister ? 'new-password' : 'current-password'"
          />
          <button
            class="grid shrink-0 place-items-center border-0 bg-transparent p-0.5 text-slate-400"
            type="button"
            :aria-label="showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'"
            @click="showPassword = !showPassword"
          >
            <EyeOff v-if="showPassword" :size="18" />
            <Eye v-else :size="18" />
          </button>
        </div>
      </FormField>

      <FormField
        v-if="isRegister"
        label="Daftar sebagai"
        for-id="role-select"
      >
        <div class="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          <button
            type="button"
            class="rounded-lg py-2 transition"
            :class="role === 'owner' ? 'bg-amber-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'"
            @click="role = 'owner'"
          >
            Pemilik Toko (Owner)
          </button>
          <button
            type="button"
            class="rounded-lg py-2 transition"
            :class="role === 'cashier' ? 'bg-amber-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'"
            @click="role = 'cashier'"
          >
            Kasir (Cashier)
          </button>
        </div>
      </FormField>

      <div v-if="!isRegister" class="-mt-1 flex items-center justify-between text-xs">
        <label class="flex cursor-pointer items-center gap-2 text-slate-600">
          <input type="checkbox" class="accent-amber-700" />
          <span>Ingat perangkat ini</span>
        </label>
        <button type="button" class="border-0 bg-transparent text-amber-700 hover:underline">
          Lupa kata sandi?
        </button>
      </div>

      <AppButton type="submit" :loading="loading">
        {{ isRegister ? 'Buat akun' : 'Masuk ke POS' }}
        <ArrowRight :size="18" aria-hidden="true" />
      </AppButton>
    </form>

    <p class="mt-8 text-center text-xs text-slate-600">
      {{ isRegister ? 'Sudah punya akses?' : 'Belum punya akses?' }}
      <button
        type="button"
        class="border-0 bg-transparent font-bold text-amber-700 hover:underline"
        @click="emit('switchMode')"
      >
        {{ isRegister ? 'Masuk di sini' : 'Daftar sebagai anggota' }}
      </button>
    </p>
  </div>
</template>
