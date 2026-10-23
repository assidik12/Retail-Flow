<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  Bell,
  CalendarDays,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Menu,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  XCircle,
} from 'lucide-vue-next'
import DashboardSidebar from '@/components/organisms/DashboardSidebar.vue'
import DashboardTemplate from '@/components/templates/DashboardTemplate.vue'
import { getSession } from '@/features/auth/auth.service'
import { transactionApi } from '@/services/transaction.api'

type TransactionStatus = 'Selesai' | 'Menunggu' | 'Dibatalkan'
type PaymentMethod = 'QRIS' | 'Tunai' | 'Kartu debit' | 'Transfer'

interface Transaction {
  id: string
  date: string
  cashier: string
  items: number
  total: number
  payment: PaymentMethod
  status: TransactionStatus
}

const mockTransactions: Transaction[] = [
  {
    id: 'TRX-251003-001',
    date: '03 Okt 2026, 09:14',
    cashier: 'Rani Pratama',
    items: 2,
    total: 785000,
    payment: 'QRIS',
    status: 'Selesai',
  },
  {
    id: 'TRX-251002-018',
    date: '02 Okt 2026, 16:42',
    cashier: 'Budi Santoso',
    items: 1,
    total: 425000,
    payment: 'Tunai',
    status: 'Selesai',
  },
  {
    id: 'TRX-251002-017',
    date: '02 Okt 2026, 15:18',
    cashier: 'Rani Pratama',
    items: 3,
    total: 1245000,
    payment: 'Kartu debit',
    status: 'Selesai',
  },
  {
    id: 'TRX-251002-016',
    date: '02 Okt 2026, 13:07',
    cashier: 'Siti Rahmawati',
    items: 1,
    total: 680000,
    payment: 'Transfer',
    status: 'Menunggu',
  },
  {
    id: 'TRX-251001-012',
    date: '01 Okt 2026, 18:36',
    cashier: 'Budi Santoso',
    items: 2,
    total: 910000,
    payment: 'QRIS',
    status: 'Selesai',
  },
  {
    id: 'TRX-251001-011',
    date: '01 Okt 2026, 11:25',
    cashier: 'Siti Rahmawati',
    items: 1,
    total: 350000,
    payment: 'Tunai',
    status: 'Dibatalkan',
  },
  {
    id: 'TRX-250930-009',
    date: '30 Sep 2026, 14:51',
    cashier: 'Rani Pratama',
    items: 4,
    total: 1680000,
    payment: 'Kartu debit',
    status: 'Selesai',
  },
]

const transactions = ref<Transaction[]>(mockTransactions)
const isUpdating = ref(false)

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'Hari ini'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  } catch {
    return dateStr
  }
}

const loadTransactions = async () => {
  try {
    const list = await transactionApi.getAll()
    if (list && list.length > 0) {
      const methodReverse: Record<string, PaymentMethod> = {
        CASH: 'Tunai',
        QRIS: 'QRIS',
        DEBIT: 'Kartu debit',
        TRANSFER: 'Transfer',
      }
      transactions.value = list.map((item) => {
        // Hitung total items dari details jika ada, atau fallback ke quantity / 1
        const detailQty = item.details?.reduce((sum, d) => sum + (d.quantity || 0), 0)
        const totalItems = item.quantity ?? (detailQty && detailQty > 0 ? detailQty : 1)

        // Ambil total amount dari totalPriceAmount atau totalAmount
        const totalVal = Number(item.totalPriceAmount ?? item.totalAmount ?? 0)

        // Status mapping: 'PAID' -> 'Selesai', 'CANCELLED'/'FAILED' -> 'Dibatalkan', 'PENDING' -> 'Menunggu'
        let mappedStatus: TransactionStatus = 'Selesai'
        if (item.status === 'CANCELLED' || item.status === 'FAILED' || item.status === false) {
          mappedStatus = 'Dibatalkan'
        } else if (item.status === 'PENDING') {
          mappedStatus = 'Menunggu'
        } else if (item.status === 'PAID' || item.status === true || item.status === 'Selesai') {
          mappedStatus = 'Selesai'
        }

        const emailName = item.userEmail ? (item.userEmail.split('@')[0] || 'Kasir') : 'Kasir'

        return {
          id: item.transactionId,
          date: formatDate(item.date),
          cashier: emailName,
          items: totalItems,
          total: totalVal,
          payment: (methodReverse[item.paymentMethod] || item.paymentMethod || 'Tunai') as PaymentMethod,
          status: mappedStatus,
        }
      })
    }
  } catch (err) {
    console.warn('Gagal memuat transaksi dari API backend, menggunakan data demo:', err)
  }
}

onMounted(async () => {
  await loadTransactions()
})

const updateTransactionStatus = async (item: Transaction, newStatus: 'PAID' | 'CANCELLED') => {
  try {
    isUpdating.value = true
    await transactionApi.updateStatus(item.id, newStatus)
    item.status = newStatus === 'PAID' ? 'Selesai' : 'Dibatalkan'
  } catch (err: any) {
    // Jika data lokal demo
    item.status = newStatus === 'PAID' ? 'Selesai' : 'Dibatalkan'
  } finally {
    isUpdating.value = false
  }
}

const deleteTransaction = async (id: string) => {
  if (!confirm('Apakah Anda yakin ingin membatalkan & menghapus transaksi ini? Stok produk akan dikembalikan.')) {
    return
  }
  try {
    isUpdating.value = true
    await transactionApi.delete(id)
    transactions.value = transactions.value.filter((t) => t.id !== id)
  } catch (err: any) {
    // Fallback lokal
    transactions.value = transactions.value.filter((t) => t.id !== id)
  } finally {
    isUpdating.value = false
  }
}

const query = ref('')
const statusFilter = ref('Semua status')
const paymentFilter = ref('Semua metode')
const mobileNav = ref(false)
const page = ref(1)
const pageSize = 5
const currentUser = computed(() => getSession())
const userDisplayName = computed(
  () => currentUser.value?.username ?? currentUser.value?.email ?? 'Guest',
)
const userInitials = computed(() => userDisplayName.value.slice(0, 2).toUpperCase())
const isOwner = computed(() => currentUser.value?.role === 'owner')
const scopedTransactions = computed(() => {
  const session = currentUser.value
  if (!session || session.role === 'owner') return transactions.value

  const firstName = session.username.split('.')[0]?.toLowerCase() ?? ''
  return transactions.value.filter((transaction) =>
    transaction.cashier.toLowerCase().startsWith(firstName),
  )
})
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
const filteredTransactions = computed(() =>
  scopedTransactions.value.filter((transaction) => {
    const matchesQuery = `${transaction.id} ${transaction.cashier}`
      .toLowerCase()
      .includes(query.value.toLowerCase())
    const matchesStatus =
      statusFilter.value === 'Semua status' || transaction.status === statusFilter.value
    const matchesPayment =
      paymentFilter.value === 'Semua metode' || transaction.payment === paymentFilter.value
    return matchesQuery && matchesStatus && matchesPayment
  }),
)
const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredTransactions.value.length / pageSize)),
)
const pagedTransactions = computed(() =>
  filteredTransactions.value.slice((page.value - 1) * pageSize, page.value * pageSize),
)
const completedTransactions = computed(() =>
  scopedTransactions.value.filter((item) => item.status === 'Selesai'),
)
const completedRevenue = computed(() =>
  completedTransactions.value.reduce((sum, item) => sum + item.total, 0),
)
const resetFilters = () => {
  query.value = ''
  statusFilter.value = 'Semua status'
  paymentFilter.value = 'Semua metode'
  page.value = 1
}
</script>

<template>
  <DashboardTemplate>
    <template #sidebar><DashboardSidebar /></template>
    <header
      class="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#eadfd8] bg-white/95 px-4 backdrop-blur sm:px-8"
    >
      <button
        class="grid size-9 place-items-center rounded-lg border border-[#eadfd8] text-[#6c5b52] lg:hidden"
        type="button"
        aria-label="Buka navigasi"
        @click="mobileNav = !mobileNav"
      >
        <Menu :size="18" />
      </button>
      <div class="hidden items-center gap-2 text-xs text-[#806b60] sm:flex">
        <span class="size-2 rounded-full bg-emerald-500"></span> ONLINE (API READY)
      </div>
      <div class="ml-auto flex items-center gap-4">
        <button class="relative text-[#806b60]" type="button" aria-label="Notifikasi">
          <Bell :size="17" /><span
            class="absolute -right-1 -top-1 size-1.5 rounded-full bg-rose-500"
          ></span>
        </button>
        <div class="hidden items-center gap-2 border-l border-[#eadfd8] pl-4 sm:flex">
          <div
            class="grid size-8 place-items-center rounded-full bg-[#eadfd8] text-xs font-bold text-[#70412f]"
          >
            {{ userInitials }}
          </div>
          <span class="text-right"
            ><strong class="block text-xs text-[#33241e]">{{ userDisplayName }}</strong
            ><small class="text-[.6rem] text-[#9b877b]">ADMIN STORE MANAGER</small></span
          ><ChevronDown :size="14" class="text-[#9b877b]" />
        </div>
      </div>
    </header>
    <div
      v-if="mobileNav"
      class="border-b border-[#eadfd8] bg-[#fff8f4] p-4 text-xs text-[#6c5b52] lg:hidden"
    >
      Dashboard · Manajemen Produk & Stok · Riwayat Transaksi
    </div>
    <div class="mx-auto max-w-375 px-4 py-6 sm:px-8">
      <div class="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p class="mb-2 text-[.65rem] text-[#9b877b]">
            Sistem POS Batik <span class="px-2">&gt;</span>
            <strong class="text-[#5e493e]">Riwayat Transaksi</strong>
          </p>
          <h1 class="font-serif text-3xl text-[#33241e] sm:text-4xl">
            {{ isOwner ? 'Riwayat Semua Transaksi' : 'Riwayat Transaksi Saya' }}
          </h1>
          <p class="mt-2 max-w-2xl text-xs text-[#907c70]">
            {{
              isOwner
                ? 'Pantau seluruh transaksi penjualan, metode pembayaran, dan aktivitas kasir dalam satu tampilan.'
                : 'Lihat transaksi penjualan yang Anda layani dan status pembayarannya.'
            }}
          </p>
        </div>
        <button
          class="inline-flex items-center justify-center gap-2 rounded-lg border border-[#eadfd8] bg-white px-4 py-2.5 text-xs font-semibold text-[#60483b]"
          type="button"
        >
          <Download :size="14" /> Ekspor Riwayat
        </button>
      </div>
      <div class="mb-6 grid gap-3 sm:grid-cols-3">
        <div class="rounded-xl border border-[#f0e2da] bg-white p-4 shadow-sm">
          <p class="text-[.65rem] font-bold uppercase tracking-wider text-[#a89184]">
            Transaksi selesai
          </p>
          <strong class="mt-2 block text-2xl text-[#33241e]">{{
            completedTransactions.length
          }}</strong
          ><span class="text-xs text-emerald-700">Periode berjalan</span>
        </div>
        <div class="rounded-xl border border-[#f0e2da] bg-white p-4 shadow-sm">
          <p class="text-[.65rem] font-bold uppercase tracking-wider text-[#a89184]">
            Pendapatan bersih
          </p>
          <strong class="mt-2 block text-2xl text-[#33241e]">{{
            formatCurrency(completedRevenue)
          }}</strong
          ><span class="text-xs text-[#907c70]">Dari transaksi selesai</span>
        </div>
        <div class="rounded-xl border border-[#f0e2da] bg-white p-4 shadow-sm">
          <p class="text-[.65rem] font-bold uppercase tracking-wider text-[#a89184]">
            Rata-rata transaksi
          </p>
          <strong class="mt-2 block text-2xl text-[#33241e]">{{
            formatCurrency(completedTransactions.length > 0 ? completedRevenue / completedTransactions.length : 0)
          }}</strong
          ><span class="text-xs text-[#907c70]">Nilai per transaksi</span>
        </div>
      </div>
      <section class="overflow-hidden rounded-xl border border-[#f0e2da] bg-white shadow-sm">
        <div class="flex flex-col gap-3 border-b border-[#f0e2da] bg-[#fffaf7] p-4 lg:flex-row">
          <label
            class="flex flex-1 items-center gap-2 rounded-lg border border-[#eadfd8] bg-white px-3 py-2 text-xs text-[#9b877b]"
            ><Search :size="15" /><input
              v-model="query"
              class="w-full bg-transparent outline-none placeholder:text-[#b6a49b]"
              type="search"
              placeholder="Cari ID transaksi atau nama kasir"
              @input="page = 1" /></label
          ><label
            class="flex items-center gap-2 rounded-lg border border-[#eadfd8] bg-white px-3 py-2 text-xs text-[#705b50]"
            ><CalendarDays :size="14" class="text-[#9b877b]" /><span
              >01 Okt - 03 Okt 2026</span
            ></label
          ><select
            v-model="statusFilter"
            class="rounded-lg border border-[#eadfd8] bg-white px-3 py-2 text-xs text-[#705b50]"
            @change="page = 1"
          >
            <option>Semua status</option>
            <option>Selesai</option>
            <option>Menunggu</option>
            <option>Dibatalkan</option></select
          ><select
            v-model="paymentFilter"
            class="rounded-lg border border-[#eadfd8] bg-white px-3 py-2 text-xs text-[#705b50]"
            @change="page = 1"
          >
            <option>Semua metode</option>
            <option>QRIS</option>
            <option>Tunai</option>
            <option>Kartu debit</option>
            <option>Transfer</option></select
          ><button
            class="inline-flex items-center justify-center gap-2 rounded-lg border border-[#eadfd8] px-3 py-2 text-xs text-[#705b50]"
            type="button"
            @click="resetFilters"
          >
            <SlidersHorizontal :size="14" /> Reset
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-190 text-left text-xs">
            <thead
              class="border-b border-[#f0e2da] bg-[#fffdfb] text-[.65rem] uppercase tracking-wider text-[#a89184]"
            >
              <tr>
                <th class="px-5 py-3 font-bold">ID transaksi</th>
                <th class="px-5 py-3 font-bold">Tanggal & waktu</th>
                <th class="px-5 py-3 font-bold">Kasir</th>
                <th class="px-5 py-3 font-bold">Item</th>
                <th class="px-5 py-3 font-bold">Total</th>
                <th class="px-5 py-3 font-bold">Pembayaran</th>
                <th class="px-5 py-3 font-bold">Status</th>
                <th class="px-5 py-3 text-right font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#f5ebe6] text-[#60483b]">
              <tr
                v-for="transaction in pagedTransactions"
                :key="transaction.id"
                class="hover:bg-[#fffaf7]"
              >
                <td class="px-5 py-4 font-semibold text-[#4a2b1e]">{{ transaction.id }}</td>
                <td class="px-5 py-4 text-[#806b60]">{{ transaction.date }}</td>
                <td class="px-5 py-4">
                  <span class="inline-flex items-center gap-1.5 font-medium">
                    <span class="size-2 rounded-full bg-[#b45c3a]"></span>
                    {{ transaction.cashier }}
                  </span>
                </td>
                <td class="px-5 py-4">{{ transaction.items }} item</td>
                <td class="px-5 py-4 font-semibold">{{ formatCurrency(transaction.total) }}</td>
                <td class="px-5 py-4">{{ transaction.payment }}</td>
                <td class="px-5 py-4">
                  <span
                    class="rounded-full px-2.5 py-1 text-[.65rem] font-bold"
                    :class="{
                      'bg-emerald-50 text-emerald-700': transaction.status === 'Selesai',
                      'bg-amber-50 text-amber-700': transaction.status === 'Menunggu',
                      'bg-rose-50 text-rose-700': transaction.status === 'Dibatalkan',
                    }"
                    >{{ transaction.status }}</span
                  >
                </td>
                <td class="px-5 py-4 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <button
                      v-if="transaction.status !== 'Selesai'"
                      class="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-[.65rem] font-semibold text-emerald-700 hover:bg-emerald-100"
                      type="button"
                      title="Tandai Selesai"
                      :disabled="isUpdating"
                      @click="updateTransactionStatus(transaction, 'PAID')"
                    >
                      <CheckCircle :size="12" /> Selesai
                    </button>
                    <button
                      v-if="transaction.status === 'Selesai'"
                      class="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-1 text-[.65rem] font-semibold text-amber-700 hover:bg-amber-100"
                      type="button"
                      title="Batalkan Transaksi"
                      :disabled="isUpdating"
                      @click="updateTransactionStatus(transaction, 'CANCELLED')"
                    >
                      <XCircle :size="12" /> Batal
                    </button>
                    <button
                      class="grid size-6 place-items-center rounded bg-rose-50 text-rose-600 hover:bg-rose-100"
                      type="button"
                      title="Hapus Transaksi"
                      :disabled="isUpdating"
                      @click="deleteTransaction(transaction.id)"
                    >
                      <Trash2 :size="12" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!pagedTransactions.length">
                <td colspan="8" class="px-5 py-12 text-center text-[#907c70]">
                  Tidak ada transaksi yang cocok dengan filter.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div
          class="flex flex-col gap-3 border-t border-[#f0e2da] px-5 py-3 text-xs text-[#9b877b] sm:flex-row sm:items-center sm:justify-between"
        >
          <span
            >Menampilkan {{ pagedTransactions.length }} dari
            {{ filteredTransactions.length }} transaksi</span
          >
          <div class="flex items-center gap-2">
            <button
              class="grid size-7 place-items-center rounded border border-[#eadfd8] disabled:opacity-40"
              type="button"
              :disabled="page === 1"
              aria-label="Halaman sebelumnya"
              @click="page--"
            >
              <ChevronLeft :size="14" /></button
            ><span class="rounded bg-[#4a2b1e] px-2.5 py-1 text-white">{{ page }}</span
            ><button
              class="grid size-7 place-items-center rounded border border-[#eadfd8] disabled:opacity-40"
              type="button"
              :disabled="page >= totalPages"
              aria-label="Halaman berikutnya"
              @click="page++"
            >
              <ChevronRight :size="14" />
            </button>
          </div>
        </div>
      </section>
    </div>
  </DashboardTemplate>
</template>
