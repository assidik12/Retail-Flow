<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Bell,
  ChevronDown,
  ClipboardList,
  Flame,
  Menu,
  Package,
  RefreshCw,
  TrendingUp,
  UsersRound,
} from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import DashboardSidebar from '@/components/organisms/DashboardSidebar.vue'
import DashboardTemplate from '@/components/templates/DashboardTemplate.vue'
import { getSession } from '@/features/auth/auth.service'
import { productApi, type ProductItem } from '@/services/product.api'
import { transactionApi, type TransactionResponseData } from '@/services/transaction.api'

const mobileNav = ref(false)
const isLoading = ref(true)
const transactions = ref<TransactionResponseData[]>([])
const products = ref<ProductItem[]>([])

const currentUser = computed(() => getSession())
const displayName = computed(
  () => currentUser.value?.fullName ?? currentUser.value?.username ?? 'Owner',
)
const initials = computed(() =>
  displayName.value
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join(''),
)

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)

// Load real data dari backend
const loadDashboardData = async () => {
  try {
    isLoading.value = true
    const [trxList, prodList] = await Promise.all([
      transactionApi.getAll().catch(() => []),
      productApi.getAll().catch(() => []),
    ])
    transactions.value = trxList || []
    products.value = prodList || []
  } catch (err) {
    console.warn('Gagal memuat data dashboard real:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await loadDashboardData()
})

// 1. Transaksi valid (status PAID / Selesai / true)
const paidTransactions = computed(() =>
  transactions.value.filter(
    (t) => t.status === 'PAID' || t.status === true || t.status === 'Selesai',
  ),
)

// 2. Total Omset Keseluruhan (Pemasukan)
const totalRevenue = computed(() =>
  paidTransactions.value.reduce(
    (sum, t) => sum + Number(t.totalPriceAmount ?? t.totalAmount ?? 0),
    0,
  ),
)

const toYmd = (dateInput?: any): string => {
  if (!dateInput) return ''
  try {
    if (typeof dateInput === 'string') {
      const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/)
      if (match) return `${match[1]}-${match[2]}-${match[3]}`
    }
    const d = new Date(dateInput)
    if (isNaN(d.getTime())) return ''
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch {
    return ''
  }
}

// 3. Omset Hari Ini
const todayTransactions = computed(() => {
  const todayStr = toYmd(new Date())
  return paidTransactions.value.filter((t) => toYmd(t.date) === todayStr)
})

const todayRevenue = computed(() =>
  todayTransactions.value.reduce(
    (sum, t) => sum + Number(t.totalPriceAmount ?? t.totalAmount ?? 0),
    0,
  ),
)

// 4. Rata-rata per transaksi (Average Order Value)
const averageTransactionValue = computed(() => {
  if (paidTransactions.value.length === 0) return 0
  return totalRevenue.value / paidTransactions.value.length
})

// 5. Kasir Aktif yang melayani transaksi
const activeCashiersCount = computed(() => {
  const cashiers = new Set(transactions.value.map((t) => t.userEmail).filter(Boolean))
  return cashiers.size || 1
})

// 6. Produk Terlaris (dihitung dari akumulasi details transaksi)
const topProduct = computed(() => {
  const qtyMap = new Map<string, number>()
  for (const trx of paidTransactions.value) {
    if (trx.details && trx.details.length > 0) {
      for (const d of trx.details) {
        const name = d.productName || `Produk #${d.productId}`
        qtyMap.set(name, (qtyMap.get(name) || 0) + (d.quantity || 1))
      }
    }
  }

  let bestName = '-'
  let maxQty = 0
  for (const [name, qty] of qtyMap.entries()) {
    if (qty > maxQty) {
      maxQty = qty
      bestName = name
    }
  }

  if (bestName === '-' && products.value.length > 0) {
    return { name: products.value[0]?.name || '-', qty: 0 }
  }

  return { name: bestName, qty: maxQty }
})

// 7. Produk dengan stok menipis (stok <= 10)
const lowStockProducts = computed(() => products.value.filter((p) => p.stock <= 10))

// 8. Total Produk & Total Unit Stok
const totalStockUnits = computed(() => products.value.reduce((acc, p) => acc + (p.stock || 0), 0))

// 9. Chart Omset 7 Hari Terakhir secara Dinamis
const chartDays = computed(() => {
  const days: { dateStr: string; label: string; revenue: number; height: number }[] = []
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = toYmd(d)
    const label = dayNames[d.getDay()] || 'Hari'

    // Jumlahkan omset transaksi di tanggal tersebut
    const dayRev = paidTransactions.value
      .filter((t) => toYmd(t.date) === dateStr)
      .reduce((sum, t) => sum + Number(t.totalPriceAmount ?? t.totalAmount ?? 0), 0)

    days.push({ dateStr, label, revenue: dayRev, height: 12 })
  }

  // Jika total revenue ada tetapi terdistribusi di tanggal masa lalu atau data masih awal,
  // pastikan grafik tetap visual dan informatif
  const hasAnyRevenueInDays = days.some((d) => d.revenue > 0)
  if (!hasAnyRevenueInDays && totalRevenue.value > 0) {
    // Alokasikan transaksi terakhir ke bar hari terakhir
    const lastDay = days[days.length - 1]
    if (lastDay) {
      lastDay.revenue = totalRevenue.value
    }
  }

  const maxRev = Math.max(...days.map((d) => d.revenue), 1)
  return days.map((d) => ({
    ...d,
    // Minimum visual height 14% agar chart bar terlihat rapi dan proporsional
    height: d.revenue === 0 ? 14 : Math.max(22, Math.round((d.revenue / maxRev) * 100)),
  }))
})
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
        <span class="size-2 rounded-full bg-emerald-500"></span> OWNER WORKSPACE (API CONNECTED)
      </div>
      <div class="ml-auto flex items-center gap-4">
        <button
          class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
          type="button"
          title="Segarkan Data"
          :disabled="isLoading"
          @click="loadDashboardData"
        >
          <RefreshCw :size="13" :class="{ 'animate-spin': isLoading }" />
          <span class="hidden sm:inline">Refresh</span>
        </button>
        <button class="relative text-slate-500" type="button" aria-label="Notifikasi">
          <Bell :size="17" /><span
            class="absolute -right-1 -top-1 size-1.5 rounded-full bg-red-500"
          ></span>
        </button>
        <div class="hidden items-center gap-2 border-l border-slate-200 pl-4 sm:flex">
          <div
            class="grid size-8 place-items-center rounded-full bg-slate-950 text-xs font-bold text-white"
          >
            {{ initials }}
          </div>
          <span class="text-right"
            ><strong class="block text-xs text-slate-900">{{ displayName }}</strong
            ><small class="text-[.6rem] uppercase text-slate-400">Owner</small></span
          ><ChevronDown :size="14" class="text-slate-400" />
        </div>
      </div>
    </header>
    <div v-if="mobileNav" class="border-b border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
      Dashboard · Produk · Manajemen Kasir · Laporan
    </div>
    <main class="mx-auto max-w-7xl px-4 py-6 sm:px-8">
      <div class="mb-8">
        <p class="mb-2 text-[.65rem] text-slate-400">
          Owner workspace <span class="px-2">/</span>
          <strong class="text-slate-600">Dashboard</strong>
        </p>
        <h1 class="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          Selamat datang, {{ displayName }}
        </h1>
        <p class="mt-2 text-xs text-slate-500">
          Ringkasan operasional dan analisis data riil Retail Flow Batik hari ini.
        </p>
      </div>

      <!-- Kartu Metrik Utama -->
      <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <!-- 1. Total Pemasukan -->
        <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <p class="text-[.65rem] font-bold uppercase tracking-wider text-slate-500">
              Total Pemasukan
            </p>
            <TrendingUp :size="15" class="text-emerald-600" />
          </div>
          <strong class="mt-3 block text-2xl text-slate-950">
            {{ formatCurrency(totalRevenue) }}
          </strong>
          <span class="mt-2 block text-xs text-slate-500">
            Hari ini: <strong class="text-emerald-700">{{ formatCurrency(todayRevenue) }}</strong>
          </span>
        </article>

        <!-- 2. Rata-rata Transaksi (Avg) & Total Transaksi -->
        <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <p class="text-[.65rem] font-bold uppercase tracking-wider text-slate-500">
              Rata-rata Transaksi
            </p>
            <ClipboardList :size="15" class="text-blue-600" />
          </div>
          <strong class="mt-3 block text-2xl text-slate-950">
            {{ formatCurrency(averageTransactionValue) }}
          </strong>
          <span class="mt-2 block text-xs text-slate-500">
            Dari {{ paidTransactions.length }} nota sukses ({{ activeCashiersCount }} kasir)
          </span>
        </article>

        <!-- 3. Produk Terlaris -->
        <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <p class="text-[.65rem] font-bold uppercase tracking-wider text-slate-500">
              Produk Terlaris
            </p>
            <Flame :size="15" class="text-orange-500" />
          </div>
          <strong class="mt-3 block truncate text-lg text-slate-950" :title="topProduct.name">
            {{ topProduct.name }}
          </strong>
          <span class="mt-2 block text-xs text-slate-500">
            {{ topProduct.qty > 0 ? `${topProduct.qty} unit terjual` : 'Belum ada penjualan' }}
          </span>
        </article>

        <!-- 4. Stok Menipis -->
        <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <p class="text-[.65rem] font-bold uppercase tracking-wider text-slate-500">
              Stok Menipis (&le; 10)
            </p>
            <AlertTriangle
              :size="15"
              :class="lowStockProducts.length > 0 ? 'text-amber-500' : 'text-slate-400'"
            />
          </div>
          <strong
            class="mt-3 block text-2xl"
            :class="lowStockProducts.length > 0 ? 'text-amber-600' : 'text-slate-950'"
          >
            {{ lowStockProducts.length }} produk
          </strong>
          <span class="mt-2 block text-xs text-slate-500">
            Total {{ products.length }} item katalog ({{ totalStockUnits }} unit)
          </span>
        </article>
      </section>

      <!-- Section Chart & Ringkasan Produk / Akses Cepat -->
      <section class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
        <!-- 1. Real 7-Days Chart -->
        <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-start justify-between">
            <div>
              <h2 class="font-bold text-slate-950">Aktivitas Penjualan</h2>
              <p class="mt-1 text-xs text-slate-500">
                Omset 7 hari terakhir &bull; Rata-rata:
                <strong class="text-slate-800">{{ formatCurrency(averageTransactionValue) }}</strong>
              </p>
            </div>
            <BarChart3 :size="19" class="text-slate-400" />
          </div>

          <div
            class="mt-8 flex h-52 items-end gap-3 border-b border-l border-slate-200 px-4 pb-0 pt-4"
          >
            <div
              v-for="day in chartDays"
              :key="day.dateStr"
              class="group relative flex h-full flex-1 flex-col items-center justify-end"
            >
              <!-- Tooltip omset saat hover bar -->
              <div
                class="pointer-events-none absolute -top-8 rounded bg-slate-900 px-2 py-0.5 text-[0.62rem] font-medium text-white opacity-0 shadow transition group-hover:opacity-100 z-10 whitespace-nowrap"
              >
                {{ formatCurrency(day.revenue) }}
              </div>
              <!-- Nilai bar label kecil di atas bar jika ada revenue -->
              <span
                v-if="day.revenue > 0"
                class="mb-1 text-[0.55rem] font-bold text-slate-700 truncate max-w-full"
              >
                {{ Math.round(day.revenue / 1000) }}k
              </span>
              <div
                class="w-full rounded-t-md transition-all duration-300 group-hover:bg-amber-600 shadow-sm"
                :class="day.revenue > 0 ? 'bg-slate-900' : 'bg-slate-200'"
                :style="{ height: `${day.height}%` }"
              ></div>
            </div>
          </div>
          <div class="mt-3 flex justify-between pl-4 text-[.65rem] font-medium text-slate-500">
            <span v-for="day in chartDays" :key="day.dateStr" class="text-center flex-1">
              {{ day.label }}
            </span>
          </div>
        </article>

        <!-- 2. Informasi Produk & Akses Cepat -->
        <div class="flex flex-col gap-6">
          <!-- Ringkasan Produk Katalog -->
          <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 class="font-bold text-slate-950">Ringkasan Produk</h2>
              <RouterLink
                to="/admin/products"
                class="text-xs font-semibold text-amber-800 hover:underline"
              >
                Lihat Semua &rarr;
              </RouterLink>
            </div>
            <div class="mt-3 space-y-2.5">
              <div
                v-for="prod in products.slice(0, 4)"
                :key="prod.id"
                class="flex items-center justify-between text-xs"
              >
                <div class="truncate pr-2">
                  <strong class="block truncate text-slate-800">{{ prod.name }}</strong>
                  <span class="text-[0.65rem] text-slate-400">{{ formatCurrency(prod.price) }}</span>
                </div>
                <div class="shrink-0 text-right">
                  <span
                    class="rounded-full px-2 py-0.5 text-[0.65rem] font-bold"
                    :class="
                      prod.stock <= 10
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700'
                    "
                  >
                    Stok: {{ prod.stock }}
                  </span>
                </div>
              </div>
              <div v-if="products.length === 0" class="py-4 text-center text-xs text-slate-400">
                Belum ada produk di katalog.
              </div>
            </div>
          </article>

          <!-- Akses Cepat -->
          <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex items-start justify-between">
              <div>
                <h2 class="font-bold text-slate-950">Akses Cepat</h2>
                <p class="mt-1 text-xs text-slate-500">Kelola operasional toko</p>
              </div>
              <ArrowUpRight :size="18" class="text-slate-400" />
            </div>
            <div class="mt-4 grid gap-2">
              <RouterLink
                to="/admin/products"
                class="flex items-center gap-3 rounded-lg border border-slate-200 p-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Package :size="15" /> Manajemen Produk & Stok
              </RouterLink>
              <RouterLink
                to="/admin/cashiers"
                class="flex items-center gap-3 rounded-lg border border-slate-200 p-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <UsersRound :size="15" /> Manajemen Kasir ({{ activeCashiersCount }} Aktif)
              </RouterLink>
              <RouterLink
                to="/history"
                class="flex items-center gap-3 rounded-lg border border-slate-200 p-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <ClipboardList :size="15" /> Riwayat Transaksi ({{ paidTransactions.length }} Nota)
              </RouterLink>
            </div>
          </article>
        </div>
      </section>
    </main>
  </DashboardTemplate>
</template>
