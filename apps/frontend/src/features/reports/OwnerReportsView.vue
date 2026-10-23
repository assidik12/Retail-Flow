<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  BarChart3,
  Bell,
  CalendarDays,
  ChevronDown,
  Download,
  FileSpreadsheet,
  Menu,
  Printer,
  TrendingUp,
} from 'lucide-vue-next'
import DashboardSidebar from '@/components/organisms/DashboardSidebar.vue'
import DashboardTemplate from '@/components/templates/DashboardTemplate.vue'
import { getSession } from '@/features/auth/auth.service'

type PaymentMethod = 'CASH' | 'QRIS' | 'TRANSFER' | 'DEBIT'
interface SaleDay {
  label: string
  revenue: number
}
interface CashierPerformance {
  name: string
  shifts: number
  transactions: number
  revenue: number
  averageTime: string
}

const dateRange = ref('This month')
const cashierFilter = ref('All cashiers')
const paymentFilter = ref('All methods')
const customFrom = ref('2026-10-01')
const customTo = ref('2026-10-07')
const mobileNav = ref(false)
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
const salesByRange: Record<string, SaleDay[]> = {
  Today: [{ label: 'Today', revenue: 4585000 }],
  'This week': [
    { label: 'Mon', revenue: 5200000 },
    { label: 'Tue', revenue: 7350000 },
    { label: 'Wed', revenue: 6100000 },
    { label: 'Thu', revenue: 8450000 },
    { label: 'Fri', revenue: 9200000 },
    { label: 'Sat', revenue: 11650000 },
    { label: 'Sun', revenue: 4585000 },
  ],
  'This month': [
    { label: '01', revenue: 8200000 },
    { label: '05', revenue: 11400000 },
    { label: '09', revenue: 9800000 },
    { label: '13', revenue: 15200000 },
    { label: '17', revenue: 12800000 },
    { label: '21', revenue: 18400000 },
    { label: '25', revenue: 16100000 },
    { label: '30', revenue: 22600000 },
  ],
  Custom: [
    { label: '01', revenue: 6200000 },
    { label: '02', revenue: 7800000 },
    { label: '03', revenue: 9450000 },
    { label: '04', revenue: 8300000 },
    { label: '05', revenue: 11200000 },
  ],
}
const paymentBreakdown: Record<PaymentMethod, number> = {
  CASH: 31,
  QRIS: 38,
  TRANSFER: 18,
  DEBIT: 13,
}
const cashiers: CashierPerformance[] = [
  { name: 'Rani Pratama', shifts: 18, transactions: 126, revenue: 16850000, averageTime: '04:12' },
  { name: 'Budi Santoso', shifts: 17, transactions: 98, revenue: 12400000, averageTime: '04:45' },
  { name: 'Siti Rahmawati', shifts: 16, transactions: 76, revenue: 9860000, averageTime: '05:08' },
  { name: 'Dewi Lestari', shifts: 15, transactions: 42, revenue: 6740000, averageTime: '05:32' },
]
const selectedSales = computed<SaleDay[]>(() => salesByRange[dateRange.value] ?? salesByRange['This month'] ?? [])
const selectedCashiers = computed(() =>
  cashierFilter.value === 'All cashiers'
    ? cashiers
    : cashiers.filter((cashier) => cashier.name === cashierFilter.value),
)
const totalRevenue = computed(() =>
  selectedCashiers.value.reduce((sum, cashier) => sum + cashier.revenue, 0),
)
const totalTransactions = computed(() =>
  selectedCashiers.value.reduce((sum, cashier) => sum + cashier.transactions, 0),
)
const averageOrderValue = computed(() =>
  totalTransactions.value ? totalRevenue.value / totalTransactions.value : 0,
)
const maxRevenue = computed(() => Math.max(...selectedSales.value.map((day) => day.revenue)))
const visiblePaymentBreakdown = computed<Record<PaymentMethod, number>>(() => {
  if (paymentFilter.value === 'All methods') return paymentBreakdown
  return Object.fromEntries(
    Object.keys(paymentBreakdown).map((method) => [
      method,
      method === paymentFilter.value ? 100 : 0,
    ]),
  ) as Record<PaymentMethod, number>
})
const donutStyle = computed(() => {
  const cash = visiblePaymentBreakdown.value.CASH
  const qris = cash + visiblePaymentBreakdown.value.QRIS
  const transfer = qris + visiblePaymentBreakdown.value.TRANSFER
  return {
    background: `conic-gradient(#0f172a 0 ${cash}%, #0f766e ${cash}% ${qris}%, #64748b ${qris}% ${transfer}%, #cbd5e1 ${transfer}% 100%)`,
  }
})
const exportExcel = () => {
  const rows = [
    ['Cashier', 'Shift count', 'Transactions', 'Revenue', 'Average transaction time'],
    ...selectedCashiers.value.map((cashier) => [
      cashier.name,
      String(cashier.shifts),
      String(cashier.transactions),
      String(cashier.revenue),
      cashier.averageTime,
    ]),
  ]
  const csv = rows
    .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(','))
    .join('\n')
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  link.download = 'retail-flow-cashier-report.csv'
  link.click()
  URL.revokeObjectURL(link.href)
}
const exportPdf = () => window.print()
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
      <div class="mb-7 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <p class="mb-2 text-[.65rem] text-slate-400">
            Owner workspace <span class="px-2">/</span>
            <strong class="text-slate-600">Reports</strong>
          </p>
          <h1 class="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Sales & Cashier Performance
          </h1>
          <p class="mt-2 text-xs text-slate-500">
            Executive overview untuk performa penjualan dan operasional kasir.
          </p>
        </div>
        <div class="flex gap-2">
          <button
            class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
            type="button"
            @click="exportPdf"
          >
            <Printer :size="15" /> Export PDF</button
          ><button
            class="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800"
            type="button"
            @click="exportExcel"
          >
            <FileSpreadsheet :size="15" /> Export Excel
          </button>
        </div>
      </div>
      <section
        class="mb-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4"
      >
        <label class="grid gap-1.5 text-[.65rem] font-bold uppercase tracking-wider text-slate-500"
          >Date range<select
            v-model="dateRange"
            class="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-normal normal-case text-slate-800 outline-none focus:border-slate-700"
          >
            <option>Today</option>
            <option>This week</option>
            <option>This month</option>
            <option>Custom</option>
          </select></label
        ><label
          v-if="dateRange === 'Custom'"
          class="grid gap-1.5 text-[.65rem] font-bold uppercase tracking-wider text-slate-500"
          >From<input
            v-model="customFrom"
            class="rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-normal text-slate-800 outline-none focus:border-slate-700"
            type="date" /></label
        ><label
          v-if="dateRange === 'Custom'"
          class="grid gap-1.5 text-[.65rem] font-bold uppercase tracking-wider text-slate-500"
          >To<input
            v-model="customTo"
            class="rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-normal text-slate-800 outline-none focus:border-slate-700"
            type="date" /></label
        ><label class="grid gap-1.5 text-[.65rem] font-bold uppercase tracking-wider text-slate-500"
          >Cashier<select
            v-model="cashierFilter"
            class="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-normal normal-case text-slate-800 outline-none focus:border-slate-700"
          >
            <option>All cashiers</option>
            <option v-for="cashier in cashiers" :key="cashier.name">{{ cashier.name }}</option>
          </select></label
        ><label class="grid gap-1.5 text-[.65rem] font-bold uppercase tracking-wider text-slate-500"
          >Payment method<select
            v-model="paymentFilter"
            class="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-normal normal-case text-slate-800 outline-none focus:border-slate-700"
          >
            <option>All methods</option>
            <option>CASH</option>
            <option>QRIS</option>
            <option>TRANSFER</option>
            <option>DEBIT</option>
          </select></label
        >
      </section>
      <section class="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <p class="text-[.65rem] font-bold uppercase tracking-wider text-slate-500">
              Total omset penjualan
            </p>
            <TrendingUp :size="17" class="text-emerald-600" />
          </div>
          <strong class="mt-3 block text-2xl text-slate-950">{{
            formatCurrency(totalRevenue)
          }}</strong
          ><span
            class="mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-1 text-[.65rem] font-bold text-emerald-700"
            >+12.5% growth</span
          >
        </article>
        <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-[.65rem] font-bold uppercase tracking-wider text-slate-500">
            Total transaksi
          </p>
          <strong class="mt-3 block text-2xl text-slate-950"
            >{{ totalTransactions }}
            <small class="text-xs font-normal text-slate-400">Nota</small></strong
          ><span class="mt-2 block text-xs text-slate-500">{{ dateRange }}</span>
        </article>
        <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-[.65rem] font-bold uppercase tracking-wider text-slate-500">
            Motif batik terlaris
          </p>
          <strong class="mt-3 block text-lg text-slate-950">Batik Megamendung</strong
          ><span class="mt-2 block text-xs text-slate-500">Size L · 86 pcs terjual</span>
        </article>
        <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-[.65rem] font-bold uppercase tracking-wider text-slate-500">
            Rata-rata transaksi / AOV
          </p>
          <strong class="mt-3 block text-2xl text-slate-950">{{
            formatCurrency(averageOrderValue)
          }}</strong
          ><span class="mt-2 block text-xs text-slate-500">Nilai rata-rata nota</span>
        </article>
      </section>
      <section class="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
        <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-start justify-between">
            <div>
              <h2 class="font-bold text-slate-950">Sales trend</h2>
              <p class="mt-1 text-xs text-slate-500">
                Daily revenue untuk {{ dateRange.toLowerCase() }}
              </p>
            </div>
            <BarChart3 :size="19" class="text-slate-400" />
          </div>
          <div
            class="mt-8 flex h-56 items-end gap-2 border-b border-l border-slate-200 px-4 pb-0 pt-4 sm:gap-4"
          >
            <div
              v-for="day in selectedSales"
              :key="day.label"
              class="group flex min-w-0 flex-1 flex-col justify-end gap-2"
            >
              <div
                class="relative rounded-t-md bg-slate-900 transition group-hover:bg-teal-700"
                :style="{ height: `${Math.max(12, (day.revenue / maxRevenue) * 100)}%` }"
              >
                <span
                  class="absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap text-[.6rem] text-slate-500 group-hover:block"
                  >{{ formatCurrency(day.revenue) }}</span
                >
              </div>
              <span class="text-center text-[.6rem] text-slate-400">{{ day.label }}</span>
            </div>
          </div>
        </article>
        <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 class="font-bold text-slate-950">Payment breakdown</h2>
            <p class="mt-1 text-xs text-slate-500">Distribusi metode pembayaran</p>
          </div>
          <div class="mt-7 flex items-center justify-center">
            <div class="grid size-40 place-items-center rounded-full" :style="donutStyle">
              <div class="grid size-24 place-items-center rounded-full bg-white text-center">
                <strong class="block text-lg text-slate-950">100%</strong
                ><span class="text-[.6rem] text-slate-400">payment mix</span>
              </div>
            </div>
          </div>
          <div class="mt-6 grid grid-cols-2 gap-3 text-xs">
            <div
              v-for="(percentage, method) in visiblePaymentBreakdown"
              :key="method"
              class="flex items-center justify-between"
            >
              <span class="flex items-center gap-2 text-slate-600"
                ><i
                  class="size-2 rounded-full"
                  :class="{
                    'bg-slate-900': method === 'CASH',
                    'bg-teal-700': method === 'QRIS',
                    'bg-slate-500': method === 'TRANSFER',
                    'bg-slate-300': method === 'DEBIT',
                  }"
                ></i
                >{{ method }}</span
              ><strong class="text-slate-900">{{ percentage }}%</strong>
            </div>
          </div>
        </article>
      </section>
      <section class="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <h2 class="font-bold text-slate-950">Cashier performance</h2>
            <p class="mt-1 text-xs text-slate-500">Produktivitas kasir pada periode terpilih</p>
          </div>
          <CalendarDays :size="18" class="text-slate-400" />
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-195 text-left text-xs">
            <thead class="bg-slate-50 text-[.62rem] uppercase tracking-wider text-slate-500">
              <tr>
                <th class="px-5 py-3 font-bold">Cashier name</th>
                <th class="px-5 py-3 font-bold">Shift count</th>
                <th class="px-5 py-3 font-bold">Transactions handled</th>
                <th class="px-5 py-3 font-bold">Revenue generated</th>
                <th class="px-5 py-3 font-bold">Avg. transaction time</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="cashier in selectedCashiers" :key="cashier.name" class="hover:bg-slate-50">
                <td class="px-5 py-4 font-semibold text-slate-900">{{ cashier.name }}</td>
                <td class="px-5 py-4 text-slate-600">{{ cashier.shifts }}</td>
                <td class="px-5 py-4 text-slate-600">{{ cashier.transactions }}</td>
                <td class="px-5 py-4 font-semibold text-slate-900">
                  {{ formatCurrency(cashier.revenue) }}
                </td>
                <td class="px-5 py-4 text-slate-600">{{ cashier.averageTime }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  </DashboardTemplate>
</template>
