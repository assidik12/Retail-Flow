<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  Bell,
  Check,
  ChevronDown,
  Edit3,
  Eye,
  EyeOff,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from 'lucide-vue-next'
import DashboardSidebar from '@/components/organisms/DashboardSidebar.vue'
import DashboardTemplate from '@/components/templates/DashboardTemplate.vue'
import { getSession, getUsers, saveUsers } from '@/features/auth/auth.service'
import type { DemoUser, UserRole } from '@/features/auth/types'
import { userApi } from '@/services/user.api'
import { authApi } from '@/services/auth.api'

interface StaffRecord extends DemoUser {
  fullName: string
  joinedAt: string
  active: boolean
}

type StaffForm = {
  fullName: string
  email: string
  phoneNumber: string
  username: string
  password: string
  role: 'CASHIER' | 'ADMIN'
}

const toStaff = (user: DemoUser): StaffRecord => ({
  ...user,
  fullName:
    user.fullName ??
    user.username
      .split('.')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' '),
  joinedAt: user.joinedAt ?? '01 Okt 2026',
  active: user.active ?? true,
})
const staff = ref<StaffRecord[]>(getUsers().map(toStaff))
const isLoading = ref(false)

const loadUsersFromBackend = async () => {
  try {
    isLoading.value = true
    const backendUsers = await userApi.getAllUsers()
    if (backendUsers && backendUsers.length > 0) {
      // Map backend users ke StaffRecord
      const localMap = new Map<string, DemoUser>()
      getUsers().forEach((u) => {
        localMap.set(u.email.toLowerCase(), u)
        localMap.set(u.username.toLowerCase(), u)
      })

      staff.value = backendUsers.map((bu) => {
        const local = localMap.get(bu.email.toLowerCase()) || localMap.get(bu.username.toLowerCase())
        const role: UserRole = bu.role?.toLowerCase() === 'owner' || bu.role?.toLowerCase() === 'admin' ? 'owner' : 'cashier'
        return {
          id: bu.id,
          username: bu.username,
          password: local?.password || '',
          email: bu.email,
          role,
          fullName: local?.fullName || bu.username.split('.').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' '),
          phoneNumber: bu.phoneNumber || local?.phoneNumber || '-',
          address: bu.address || local?.address || '',
          posCode: bu.posCode || local?.posCode || '',
          joinedAt: local?.joinedAt || '19 Okt 2026',
          active: local?.active ?? true,
        }
      })
    }
  } catch (err) {
    console.warn('Gagal mengambil users dari backend, menggunakan data lokal:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await loadUsersFromBackend()
})
const currentUser = computed(() => getSession())
const currentName = computed(() => currentUser.value?.username ?? 'Owner')
const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()
const query = ref('')
const statusFilter = ref('All status')
const mobileNav = ref(false)
const modalOpen = ref(false)
const passwordVisible = ref(false)
const editingStaff = ref<StaffRecord | null>(null)
const submitted = ref(false)
const confirmOpen = ref(false)
const confirmAction = ref<'deactivate' | 'delete'>('deactivate')
const confirmTarget = ref<StaffRecord | null>(null)
const form = ref<StaffForm>({
  fullName: '',
  email: '',
  phoneNumber: '',
  username: '',
  password: '',
  role: 'CASHIER',
})
const filteredStaff = computed(() =>
  staff.value.filter((person) => {
    const matchesQuery = `${person.fullName} ${person.username} ${person.email}`
      .toLowerCase()
      .includes(query.value.toLowerCase())
    const matchesStatus =
      statusFilter.value === 'All status' ||
      (statusFilter.value === 'Active' ? person.active : !person.active)
    return matchesQuery && matchesStatus
  }),
)
const activeCount = computed(() => staff.value.filter((person) => person.active).length)
const resetForm = () => {
  form.value = {
    fullName: '',
    email: '',
    phoneNumber: '',
    username: '',
    password: '',
    role: 'CASHIER',
  }
  submitted.value = false
  passwordVisible.value = false
}
const openCreate = () => {
  editingStaff.value = null
  resetForm()
  modalOpen.value = true
}
const openEdit = (person: StaffRecord) => {
  editingStaff.value = person
  submitted.value = false
  passwordVisible.value = false
  form.value = {
    fullName: person.fullName,
    email: person.email,
    phoneNumber: person.phoneNumber,
    username: person.username,
    password: '',
    role: person.role === 'owner' ? 'ADMIN' : 'CASHIER',
  }
  modalOpen.value = true
}
const persist = () =>
  saveUsers(
    staff.value.map(({ fullName, joinedAt, active, ...user }) => ({
      ...user,
      fullName,
      joinedAt,
      active,
    })),
  )
const saveStaff = async () => {
  submitted.value = true
  if (
    !form.value.fullName.trim() ||
    !form.value.email.trim() ||
    !form.value.username.trim() ||
    (!editingStaff.value && !form.value.password.trim())
  )
    return
  const role: UserRole = form.value.role === 'ADMIN' ? 'owner' : 'cashier'
  if (editingStaff.value) {
    Object.assign(editingStaff.value, {
      fullName: form.value.fullName.trim(),
      email: form.value.email.trim().toLowerCase(),
      phoneNumber: form.value.phoneNumber.trim(),
      username: form.value.username.trim().toLowerCase(),
      role,
      ...(form.value.password ? { password: form.value.password } : {}),
    })
  } else {
    const username = form.value.username.trim().toLowerCase()
    const email = form.value.email.trim().toLowerCase()
    const password = form.value.password
    const fullName = form.value.fullName.trim()
    const phoneNumber = form.value.phoneNumber.trim()

    // Daftarkan ke backend agar bisa langsung login menggunakan email & password ini
    try {
      await authApi.register({
        username,
        email,
        password,
        phoneNumber: phoneNumber || '08123456789',
        address: '-',
        posCode: '00000',
        role: role === 'owner' ? 'OWNER' : 'CASHIER',
      })
    } catch (err: any) {
      console.warn('Gagal mendaftarkan staf ke backend (kemungkinan sudah ada atau offline):', err)
    }

    staff.value.unshift({
      username,
      password,
      email,
      role,
      fullName,
      phoneNumber,
      address: '',
      posCode: '',
      joinedAt: new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      active: true,
    })
  }
  persist()
  modalOpen.value = false
}
const resetPassword = (person: StaffRecord) => {
  const nextPassword = window.prompt(`Password baru untuk ${person.fullName}`)
  if (!nextPassword) return
  person.password = nextPassword
  persist()
}
const askConfirmation = (person: StaffRecord, action: 'deactivate' | 'delete') => {
  confirmTarget.value = person
  confirmAction.value = action
  confirmOpen.value = true
}
const confirmChange = () => {
  if (!confirmTarget.value) return
  if (confirmAction.value === 'delete')
    staff.value = staff.value.filter((person) => person.username !== confirmTarget.value?.username)
  else confirmTarget.value.active = !confirmTarget.value.active
  persist()
  confirmOpen.value = false
  confirmTarget.value = null
}
</script>

<template>
  <DashboardTemplate>
    <template #sidebar><DashboardSidebar /></template>
    <header
      class="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-8"
    >
      <button
        class="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-600 lg:hidden"
        type="button"
        aria-label="Buka navigasi"
        @click="mobileNav = !mobileNav"
      >
        <Menu :size="18" />
      </button>
      <div class="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
        <span class="size-2 rounded-full bg-emerald-500"></span> OWNER WORKSPACE
      </div>
      <div class="ml-auto flex items-center gap-4">
        <button class="relative text-slate-500" type="button" aria-label="Notifikasi">
          <Bell :size="17" /><span
            class="absolute -right-1 -top-1 size-1.5 rounded-full bg-red-500"
          ></span>
        </button>
        <div class="hidden items-center gap-2 border-l border-slate-200 pl-4 sm:flex">
          <div
            class="grid size-8 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white"
          >
            {{ initials(currentName) }}
          </div>
          <span class="text-right"
            ><strong class="block text-xs text-slate-900">{{ currentName }}</strong
            ><small class="text-[.6rem] uppercase text-slate-400">Owner</small></span
          ><ChevronDown :size="14" class="text-slate-400" />
        </div>
      </div>
    </header>
    <div v-if="mobileNav" class="border-b border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
      Dashboard · Produk · Manajemen Kasir · Laporan
    </div>
    <main class="mx-auto max-w-7xl px-4 py-6 sm:px-8">
      <div class="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p class="mb-2 text-[.65rem] text-slate-400">
            Owner workspace <span class="px-2">/</span>
            <strong class="text-slate-600">Manajemen Kasir & Staf</strong>
          </p>
          <h1 class="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Manajemen Kasir & Staf
          </h1>
          <p class="mt-2 max-w-2xl text-xs text-slate-500">
            Kelola akses, status, dan data anggota tim yang menjalankan operasional toko.
          </p>
        </div>
        <button
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800"
          type="button"
          @click="openCreate"
        >
          <Plus :size="16" /> Tambah Kasir Baru
        </button>
      </div>
      <div class="mb-6 grid gap-3 sm:grid-cols-3">
        <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-[.65rem] font-bold uppercase tracking-wider text-slate-500"
              >Total staf</span
            ><UsersRound :size="17" class="text-slate-400" />
          </div>
          <strong class="mt-2 block text-2xl text-slate-950">{{ staff.length }}</strong>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-[.65rem] font-bold uppercase tracking-wider text-slate-500"
              >Active users</span
            ><ShieldCheck :size="17" class="text-emerald-600" />
          </div>
          <strong class="mt-2 block text-2xl text-slate-950">{{ activeCount }}</strong>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-[.65rem] font-bold uppercase tracking-wider text-slate-500"
              >Inactive users</span
            ><UserRound :size="17" class="text-slate-400" />
          </div>
          <strong class="mt-2 block text-2xl text-slate-950">{{
            staff.length - activeCount
          }}</strong>
        </div>
      </div>
      <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div class="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 p-4 md:flex-row">
          <label
            class="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-400"
            ><Search :size="15" /><input
              v-model="query"
              class="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
              type="search"
              placeholder="Cari nama atau username" /></label
          ><select
            v-model="statusFilter"
            class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
          >
            <option>All status</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-262.5 text-left text-xs">
            <thead
              class="border-b border-slate-200 bg-white text-[.62rem] uppercase tracking-wider text-slate-500"
            >
              <tr>
                <th class="px-5 py-3 font-bold">Cashier</th>
                <th class="px-5 py-3 font-bold">Username</th>
                <th class="px-5 py-3 font-bold">Email</th>
                <th class="px-5 py-3 font-bold">Phone number</th>
                <th class="px-5 py-3 font-bold">Date joined</th>
                <th class="px-5 py-3 font-bold">Status</th>
                <th class="px-5 py-3 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="person in filteredStaff" :key="person.username" class="hover:bg-slate-50">
                <td class="px-5 py-4">
                  <div class="flex items-center gap-3">
                    <div
                      class="grid size-9 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-700"
                    >
                      {{ initials(person.fullName) }}
                    </div>
                    <div>
                      <strong class="block text-slate-900">{{ person.fullName }}</strong
                      ><span
                        class="mt-1 flex items-center gap-1 text-[.65rem] uppercase text-slate-400"
                        ><ShieldCheck v-if="person.role === 'owner'" :size="11" />
                        {{ person.role === 'owner' ? 'ADMIN' : 'CASHIER' }}</span
                      >
                    </div>
                  </div>
                </td>
                <td class="px-5 py-4 font-mono text-[.68rem] text-slate-600">
                  {{ person.username }}
                </td>
                <td class="px-5 py-4 text-slate-600">{{ person.email }}</td>
                <td class="px-5 py-4 text-slate-600">{{ person.phoneNumber || '-' }}</td>
                <td class="px-5 py-4 text-slate-500">{{ person.joinedAt }}</td>
                <td class="px-5 py-4">
                  <span
                    class="rounded-full px-2.5 py-1 text-[.65rem] font-semibold"
                    :class="
                      person.active
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    "
                    >{{ person.active ? 'Active' : 'Inactive' }}</span
                  >
                </td>
                <td class="px-5 py-4">
                  <div class="flex justify-end gap-1">
                    <button
                      class="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                      type="button"
                      title="Edit"
                      @click="openEdit(person)"
                    >
                      <Edit3 :size="14" /></button
                    ><button
                      class="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                      type="button"
                      title="Reset password"
                      @click="resetPassword(person)"
                    >
                      <MoreHorizontal :size="15" /></button
                    ><button
                      class="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                      type="button"
                      :title="person.active ? 'Deactivate' : 'Activate'"
                      @click="askConfirmation(person, 'deactivate')"
                    >
                      <Check v-if="person.active" :size="14" /><X v-else :size="14" /></button
                    ><button
                      class="grid size-8 place-items-center rounded-lg text-red-600 hover:bg-red-50"
                      type="button"
                      title="Delete"
                      @click="askConfirmation(person, 'delete')"
                    >
                      <Trash2 :size="14" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!filteredStaff.length">
                <td colspan="7" class="px-5 py-14 text-center text-slate-500">
                  Tidak ada kasir yang cocok.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
          Menampilkan {{ filteredStaff.length }} dari {{ staff.length }} staf
        </div>
      </section>
    </main>

    <div
      v-if="modalOpen"
      class="fixed inset-0 z-40 flex justify-end bg-slate-950/40"
      @click.self="modalOpen = false"
    >
      <section class="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl sm:p-8">
        <div class="mb-7 flex items-start justify-between">
          <div>
            <p class="mb-1 text-[.65rem] font-bold uppercase tracking-wider text-slate-500">
              Team access
            </p>
            <h2 class="text-2xl font-bold text-slate-950">
              {{ editingStaff ? 'Edit data staf' : 'Tambah kasir baru' }}
            </h2>
          </div>
          <button
            class="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-500"
            type="button"
            aria-label="Tutup"
            @click="modalOpen = false"
          >
            <X :size="17" />
          </button>
        </div>
        <form class="grid gap-4" @submit.prevent="saveStaff">
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="grid gap-1.5 text-xs font-semibold text-slate-700"
              >Full name<input
                v-model="form.fullName"
                class="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-700"
                :class="submitted && !form.fullName ? 'border-red-400' : ''"
                placeholder="Siti Rahmawati"
              /><small v-if="submitted && !form.fullName" class="font-normal text-red-600"
                >Nama wajib diisi.</small
              ></label
            ><label class="grid gap-1.5 text-xs font-semibold text-slate-700"
              >Email<input
                v-model="form.email"
                type="email"
                class="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-700"
                placeholder="siti@retailflow.id"
              /><small v-if="submitted && !form.email" class="font-normal text-red-600"
                >Email wajib diisi.</small
              ></label
            >
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="grid gap-1.5 text-xs font-semibold text-slate-700"
              >Phone number<input
                v-model="form.phoneNumber"
                class="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-700"
                placeholder="081234567890" /></label
            ><label class="grid gap-1.5 text-xs font-semibold text-slate-700"
              >Username<input
                v-model="form.username"
                class="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-700"
                placeholder="siti.aminah"
              /><small v-if="submitted && !form.username" class="font-normal text-red-600"
                >Username wajib diisi.</small
              ></label
            >
          </div>
          <label class="grid gap-1.5 text-xs font-semibold text-slate-700"
            >Password<input
              v-model="form.password"
              :type="passwordVisible ? 'text' : 'password'"
              class="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-700"
              :placeholder="editingStaff ? 'Kosongkan jika tidak berubah' : 'Minimal 8 karakter'"
            /><button
              class="-mt-10 mr-3 self-end text-slate-400"
              type="button"
              :aria-label="passwordVisible ? 'Sembunyikan password' : 'Tampilkan password'"
              @click="passwordVisible = !passwordVisible"
            >
              <EyeOff v-if="passwordVisible" :size="16" /><Eye v-else :size="16" /></button
            ><small
              v-if="submitted && !editingStaff && !form.password"
              class="font-normal text-red-600"
              >Password wajib diisi.</small
            ></label
          ><label class="grid gap-1.5 text-xs font-semibold text-slate-700"
            >Role assignment<select
              v-model="form.role"
              class="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-700"
            >
              <option value="CASHIER">CASHIER</option>
              <option value="ADMIN">ADMIN</option>
            </select></label
          >
          <div class="flex justify-end gap-2 border-t border-slate-200 pt-5">
            <button
              class="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600"
              type="button"
              @click="modalOpen = false"
            >
              Batal</button
            ><button
              class="rounded-lg bg-slate-950 px-4 py-2.5 text-xs font-bold text-white"
              type="submit"
            >
              {{ editingStaff ? 'Simpan perubahan' : 'Tambah kasir' }}
            </button>
          </div>
        </form>
      </section>
    </div>

    <div
      v-if="confirmOpen && confirmTarget"
      class="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"
    >
      <section class="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div class="flex items-start gap-3">
          <div
            class="grid size-10 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-700"
          >
            <ShieldCheck :size="18" />
          </div>
          <div>
            <h2 class="font-bold text-slate-950">
              {{
                confirmAction === 'delete'
                  ? 'Hapus akun staf?'
                  : confirmTarget.active
                    ? 'Nonaktifkan akun?'
                    : 'Aktifkan akun?'
              }}
            </h2>
            <p class="mt-2 text-xs leading-5 text-slate-500">
              {{
                confirmAction === 'delete'
                  ? `Akun ${confirmTarget.fullName} akan dihapus dari daftar staf.`
                  : `Status ${confirmTarget.fullName} akan diubah dan akses login ikut diperbarui.`
              }}
            </p>
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-2">
          <button
            class="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600"
            type="button"
            @click="confirmOpen = false"
          >
            Batal</button
          ><button
            class="rounded-lg bg-slate-950 px-4 py-2.5 text-xs font-bold text-white"
            type="button"
            @click="confirmChange"
          >
            Konfirmasi
          </button>
        </div>
      </section>
    </div>
  </DashboardTemplate>
</template>
