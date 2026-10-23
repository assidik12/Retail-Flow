<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Bell, ChevronDown, Download, Filter, Menu, Plus, RefreshCw, Search } from 'lucide-vue-next'
import DashboardSidebar from '@/components/organisms/DashboardSidebar.vue'
import ProductFormDialog from '@/components/organisms/ProductFormDialog.vue'
import ProductStats from '@/components/organisms/ProductStats.vue'
import ProductTable from '@/components/organisms/ProductTable.vue'
import DashboardTemplate from '@/components/templates/DashboardTemplate.vue'
import { getSession } from '@/features/auth/auth.service'
import { productApi } from '@/services/product.api'
import products from '@/data/products.json'
import type { ProductDraft, ProductRecord } from './types'

const sourceProducts: ProductRecord[] = products.map((product, index) => ({
  ...product,
  costPrice: Math.round(product.price * 0.62),
  id: `product-${index + 1}`,
  sku: `BTK-${String(index + 1).padStart(3, '0')}`,
  category: ['Batik Tulis', 'Batik Cap', 'Batik Tulis', 'Kain'][index] ?? 'Batik Tulis',
  stock: [18, 8, 14, 4][index] ?? 0,
  stockBySize: { S: 3, M: 5, L: 5, XL: 3, XXL: 2 },
}))
const productList = ref<ProductRecord[]>(sourceProducts)
const isLoading = ref(false)

const loadProducts = async () => {
  isLoading.value = true
  try {
    const backendProducts = await productApi.getAll()
    if (backendProducts && backendProducts.length > 0) {
      productList.value = backendProducts.map((p, idx) => ({
        id: String(p.id),
        sku: `PRD-${String(p.id).padStart(3, '0')}`,
        name: p.name,
        price: p.price,
        costPrice: Math.round(p.price * 0.65),
        size: 'All Size',
        stockBySize: { All: p.stock },
        Rate: '4.8',
        deskription: p.name,
        category: 'Katalog Produk',
        stock: p.stock,
      }))
    }
  } catch (err) {
    console.warn('Gagal memuat produk dari API backend, menggunakan data lokal fallback:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadProducts()
})
const query = ref('')
const categoryFilter = ref('Semua kategori')
const statusFilter = ref('Semua status stok')
const sortKey = ref<keyof ProductRecord | null>(null)
const sortDirection = ref<'asc' | 'desc'>('asc')
const page = ref(1)
const pageSize = 8
const dialogOpen = ref(false)
const editingProduct = ref<ProductRecord | null>(null)
const viewOnly = ref(false)
const mobileNav = ref(false)
const currentUser = computed(() => getSession())
const userDisplayName = computed(
  () => currentUser.value?.username ?? currentUser.value?.email ?? 'Guest',
)
const userInitials = computed(() => {
  const source = userDisplayName.value
  const parts = source.split(/[\s._-]+/).filter(Boolean)
  if (!parts.length) return 'G'

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
})
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
const filteredProducts = computed(() =>
  productList.value.filter((product) => {
    const matchesQuery = `${product.name} ${product.sku} ${product.deskription}`
      .toLowerCase()
      .includes(query.value.toLowerCase())
    const matchesCategory =
      categoryFilter.value === 'Semua kategori' || product.category === categoryFilter.value
    const matchesStatus =
      statusFilter.value === 'Semua status stok' ||
      (statusFilter.value === 'Tersedia' && product.stock > 10) ||
      (statusFilter.value === 'Stok menipis' && product.stock > 0 && product.stock <= 10) ||
      (statusFilter.value === 'Habis' && product.stock === 0)
    return matchesQuery && matchesCategory && matchesStatus
  }),
)
const sortedProducts = computed(() =>
  [...filteredProducts.value].sort((a, b) => {
    if (!sortKey.value) return 0
    const left = a[sortKey.value] ?? ''
    const right = b[sortKey.value] ?? ''
    return (left < right ? -1 : left > right ? 1 : 0) * (sortDirection.value === 'asc' ? 1 : -1)
  }),
)
const pagedProducts = computed(() =>
  sortedProducts.value.slice((page.value - 1) * pageSize, page.value * pageSize),
)
const totalPages = computed(() => Math.max(1, Math.ceil(sortedProducts.value.length / pageSize)))
const inventoryValue = computed(() =>
  productList.value.reduce((sum, product) => sum + product.price * product.stock, 0),
)
const lowStock = computed(
  () => productList.value.filter((product) => product.stock > 0 && product.stock <= 10).length,
)
const outOfStock = computed(() => productList.value.filter((product) => product.stock === 0).length)
const openCreate = () => {
  editingProduct.value = null
  viewOnly.value = false
  dialogOpen.value = true
}
const openEdit = (product: ProductRecord) => {
  editingProduct.value = product
  viewOnly.value = false
  dialogOpen.value = true
}
const openView = (product: ProductRecord) => {
  editingProduct.value = product
  viewOnly.value = true
  dialogOpen.value = true
}
const removeProduct = async (product: ProductRecord) => {
  if (!window.confirm(`Hapus ${product.name} dari katalog?`)) return
  const numId = Number(product.id)
  if (!isNaN(numId)) {
    try {
      await productApi.delete(numId)
    } catch (e) {
      console.warn('Gagal menghapus via API, menghapus secara lokal:', e)
    }
  }
  productList.value = productList.value.filter((item) => item.id !== product.id)
}
const saveProduct = async (draft: ProductDraft) => {
  if (editingProduct.value) {
    const numId = Number(editingProduct.value.id)
    if (!isNaN(numId)) {
      try {
        await productApi.update(numId, {
          name: draft.name,
          price: draft.price,
          stock: draft.stock,
        })
      } catch (e) {
        console.warn('Gagal update via API, memperbarui secara lokal:', e)
      }
    }
    const index = productList.value.findIndex((item) => item.id === editingProduct.value?.id)
    if (index >= 0) productList.value[index] = { ...editingProduct.value, ...draft }
  } else {
    try {
      const created = await productApi.create({
        name: draft.name,
        price: draft.price,
        stock: draft.stock,
      })
      productList.value.unshift({
        ...draft,
        id: String(created.id),
        sku: `PRD-${String(created.id).padStart(3, '0')}`,
        Rate: '0.0',
      })
    } catch (e) {
      console.warn('Gagal create via API, menyimpan secara lokal:', e)
      const nextNumber = productList.value.length + 1
      productList.value.push({
        ...draft,
        id: `product-${Date.now()}`,
        sku: draft.sku || `BTK-${String(nextNumber).padStart(3, '0')}`,
        Rate: '0.0',
      })
    }
  }
  dialogOpen.value = false
  viewOnly.value = false
}
const sortProducts = (key: keyof ProductRecord) => {
  if (sortKey.value === key) sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  else {
    sortKey.value = key
    sortDirection.value = 'asc'
  }
}
const resetFilters = () => {
  query.value = ''
  categoryFilter.value = 'Semua kategori'
  statusFilter.value = 'Semua status stok'
  page.value = 1
}
</script>

<template>
  <DashboardTemplate
    ><template #sidebar><DashboardSidebar /></template>
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
            ><small class="text-[.6rem] text-[#9b877b]">
              {{ currentUser?.role }}
            </small></span
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
    <div class="mx-auto max-w-7xl px-4 py-6 sm:px-8">
      <div class="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p class="mb-2 text-[.65rem] text-[#9b877b]">
            Sistem POS Batik <span class="px-2">&gt;</span>
            <strong class="text-[#5e493e]">Manajemen Produk & Stok</strong>
          </p>
          <h1 class="font-serif text-3xl text-[#33241e] sm:text-4xl">
            Manajemen Produk & Stok Batik
          </h1>
          <p class="mt-2 max-w-2xl text-xs text-[#907c70]">
            Kelola master data katalog batik, varian motif warisan, penetapan harga jual retail, dan
            pantau kuantitas inventaris gudang secara tersinkronisasi.
          </p>
        </div>
        <div class="flex gap-2">
          <button
            class="inline-flex items-center gap-2 rounded-lg border border-[#eadfd8] bg-white px-4 py-2.5 text-xs font-semibold text-[#60483b]"
            type="button"
          >
            <Download :size="14" /> Ekspor Data</button
          ><button
            class="inline-flex items-center gap-2 rounded-lg bg-[#4a2b1e] px-4 py-2.5 text-xs font-semibold text-white shadow-sm"
            type="button"
            @click="openCreate"
          >
            <Plus :size="15" /> Tambah Produk
          </button>
        </div>
      </div>
      <ProductStats
        :total-products="productList.length"
        :inventory-value="inventoryValue"
        :low-stock="lowStock"
        :out-of-stock="outOfStock"
        :format-currency="formatCurrency"
      />
      <section class="mt-6 overflow-hidden rounded-xl border border-[#f0e2da] bg-white shadow-sm">
        <div class="flex flex-col gap-3 border-b border-[#f0e2da] bg-[#fffaf7] p-4 lg:flex-row">
          <label
            class="flex flex-1 items-center gap-2 rounded-lg border border-[#eadfd8] bg-white px-3 py-2 text-xs text-[#9b877b]"
            ><Search :size="15" /><input
              v-model="query"
              class="w-full bg-transparent outline-none placeholder:text-[#b6a49b]"
              type="search"
              placeholder="Cari berdasarkan SKU, nama motif, atau bahan" /></label
          ><select
            v-model="categoryFilter"
            class="rounded-lg border border-[#eadfd8] bg-white px-3 py-2 text-xs text-[#705b50]"
          >
            <option>Semua kategori</option>
            <option>Batik Tulis</option>
            <option>Batik Cap</option>
            <option>Kain</option></select
          ><select
            v-model="statusFilter"
            class="rounded-lg border border-[#eadfd8] bg-white px-3 py-2 text-xs text-[#705b50]"
          >
            <option>Semua status stok</option>
            <option>Tersedia</option>
            <option>Stok menipis</option>
            <option>Habis</option></select
          ><button
            class="inline-flex items-center justify-center gap-2 rounded-lg border border-[#eadfd8] px-3 py-2 text-xs text-[#705b50]"
            type="button"
            @click="resetFilters"
          >
            <Filter :size="14" /> Reset <RefreshCw :size="13" />
          </button>
        </div>
        <ProductTable
          :products="pagedProducts"
          :format-currency="formatCurrency"
          :sort-key="sortKey"
          :sort-direction="sortDirection"
          @edit="openEdit"
          @remove="removeProduct"
          @view="openView"
          @sort="sortProducts"
        />
        <div
          class="flex flex-col gap-3 border-t border-[#f0e2da] px-4 py-3 text-xs text-[#9b877b] sm:flex-row sm:items-center sm:justify-between"
        >
          <span
            >Menampilkan {{ pagedProducts.length }} dari {{ sortedProducts.length }} produk
            batik</span
          >
          <div class="flex items-center gap-2">
            <button
              class="rounded border border-[#eadfd8] px-2 py-1 disabled:opacity-40"
              type="button"
              :disabled="page === 1"
              @click="page--"
            >
              Sebelumnya</button
            ><span class="rounded bg-[#4a2b1e] px-2.5 py-1 text-white">{{ page }}</span
            ><button
              class="rounded border border-[#eadfd8] px-2 py-1 disabled:opacity-40"
              type="button"
              :disabled="page >= totalPages"
              @click="page++"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </section>
    </div>
    <ProductFormDialog
      :open="dialogOpen"
      :product="editingProduct"
      :view-only="viewOnly"
      @close="dialogOpen = false"
      @save="saveProduct"
  /></DashboardTemplate>
</template>
