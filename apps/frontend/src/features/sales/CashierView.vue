<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  Banknote,
  Bell,
  Check,
  ChevronDown,
  CreditCard,
  Minus,
  Menu,
  Plus,
  ReceiptText,
  Search,
  ShoppingBag,
  Smartphone,
  Trash2,
  X,
} from 'lucide-vue-next'
import DashboardSidebar from '@/components/organisms/DashboardSidebar.vue'
import DashboardTemplate from '@/components/templates/DashboardTemplate.vue'
import { getSession } from '@/features/auth/auth.service'
import { productApi } from '@/services/product.api'
import { transactionApi } from '@/services/transaction.api'
import products from '@/data/products.json'

type PaymentMethod = 'Tunai' | 'QRIS' | 'Kartu debit'

interface Product {
  id?: number
  name: string
  price: number
  size: string
  Rate: string
  deskription: string
}

interface CartItem extends Product {
  cartId: string
  selectedSize: string
  quantity: number
}

const productList = ref<Product[]>((products as Product[]).map((p, idx) => ({ ...p, id: idx + 1 })))

const todayMyTransactionsCount = ref(0)

const fetchMyTransactionsCount = async () => {
  try {
    const list = await transactionApi.getAll()
    if (list) {
      todayMyTransactionsCount.value = list.length
    }
  } catch (err) {
    console.warn('Gagal load transaksi kasir:', err)
  }
}

onMounted(async () => {
  try {
    const backendProducts = await productApi.getAll()
    if (backendProducts && backendProducts.length > 0) {
      productList.value = backendProducts.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        size: 'All Size',
        Rate: '5.0',
        deskription: p.name,
      }))
    }
  } catch (err) {
    console.warn('Gagal load produk kasir dari backend, menggunakan data demo:', err)
  }
  await fetchMyTransactionsCount()
})
const query = ref('')
const category = ref('Semua produk')
const cart = ref<CartItem[]>([])
const paymentMethod = ref<PaymentMethod>('Tunai')
const cashReceived = ref(0)
const mobileNav = ref(false)
const checkoutComplete = ref(false)
const selectedProduct = ref<Product | null>(null)
const selectedSize = ref('')
const currentUser = computed(() => getSession())
const userDisplayName = computed(
  () => currentUser.value?.username ?? currentUser.value?.email ?? 'Guest',
)
const userInitials = computed(() => userDisplayName.value.slice(0, 2).toUpperCase())
const productCategory = (product: Product) => {
  if (product.name.startsWith('Kemeja')) return 'Kemeja'
  if (product.name.startsWith('Outer') || product.name.startsWith('Blus')) return 'Blus & Outer'
  if (product.name.startsWith('Kain')) return 'Kain'
  return 'Lainnya'
}
const filteredProducts = computed(() => {
  const normalizedQuery = query.value.toLowerCase()
  return productList.value.filter(
    (product) =>
      `${product.name} ${product.deskription}`.toLowerCase().includes(normalizedQuery) &&
      (category.value === 'Semua produk' || productCategory(product) === category.value),
  )
})
const subtotal = computed(() =>
  cart.value.reduce((sum, item) => sum + item.price * item.quantity, 0),
)
const serviceFee = computed(() => (subtotal.value ? 5000 : 0))
const total = computed(() => subtotal.value + serviceFee.value)
const totalItems = computed(() => cart.value.reduce((sum, item) => sum + item.quantity, 0))
const change = computed(() => Math.max(0, cashReceived.value - total.value))
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)

const openProduct = (product: Product) => {
  selectedProduct.value = product
  selectedSize.value = product.size.split('-')[0]?.trim() ?? product.size
}
const addToCart = () => {
  if (!selectedProduct.value) return
  const product = selectedProduct.value
  const cartId = `${product.name}-${selectedSize.value}`
  const existingItem = cart.value.find((item) => item.cartId === cartId)
  if (existingItem) existingItem.quantity += 1
  else cart.value.push({ ...product, cartId, selectedSize: selectedSize.value, quantity: 1 })
  selectedProduct.value = null
}
const updateQuantity = (item: CartItem, amount: number) => {
  item.quantity += amount
  if (item.quantity <= 0)
    cart.value = cart.value.filter((cartItem) => cartItem.cartId !== item.cartId)
}
const completeCheckout = async () => {
  if (!cart.value.length || (paymentMethod.value === 'Tunai' && cashReceived.value < total.value))
    return

  const methodMap: Record<PaymentMethod, 'CASH' | 'QRIS' | 'DEBIT'> = {
    Tunai: 'CASH',
    QRIS: 'QRIS',
    'Kartu debit': 'DEBIT',
  }

  // Kirim transaksi ke backend untuk setiap item keranjang
  const currentEmail = currentUser.value?.email || 'kasir@retailflow.id'
  for (const item of cart.value) {
    if (item.id) {
      try {
        const itemTotal = item.price * item.quantity
        const paid = paymentMethod.value === 'Tunai' ? Math.max(cashReceived.value, itemTotal) : itemTotal
        await transactionApi.create({
          productId: item.id,
          quantity: item.quantity,
          paymentMethod: methodMap[paymentMethod.value] || 'CASH',
          paidAmount: paid,
          amountPaid: paid,
          userEmail: currentEmail,
        })
      } catch (e) {
        console.warn('Gagal mencatat transaksi ke backend, lanjut checkout lokal:', e)
      }
    }
  }

  checkoutComplete.value = true
  await fetchMyTransactionsCount()
}
const newTransaction = () => {
  cart.value = []
  cashReceived.value = 0
  checkoutComplete.value = false
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
        <span class="size-2 rounded-full bg-emerald-500"></span> KASIR AKTIF
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
            ><small class="text-[.8rem] text-[#9b877b]">{{ currentUser?.role }}</small></span
          ><ChevronDown :size="14" class="text-[#9b877b]" />
        </div>
      </div>
    </header>
    <div
      v-if="mobileNav"
      class="border-b border-[#eadfd8] bg-[#fff8f4] p-4 text-xs text-[#6c5b52] lg:hidden"
    >
      Kasir · Manajemen Produk · Riwayat Transaksi
    </div>
    <div class="mx-auto max-w-[1600px] px-4 py-6 sm:px-8">
      <div class="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p class="mb-2 text-[.65rem] text-[#9b877b]">
            Sistem POS Batik <span class="px-2">&gt;</span>
            <strong class="text-[#5e493e]">Kasir</strong>
          </p>
          <h1 class="font-serif text-3xl text-[#33241e] sm:text-4xl">Penjualan Baru</h1>
          <p class="mt-2 text-xs text-[#907c70]">
            Pilih produk batik, atur ukuran, lalu selesaikan pembayaran pelanggan.
          </p>
        </div>
        <div
          class="flex items-center gap-2 rounded-lg bg-[#fdf0e9] px-3 py-2 text-xs text-[#70412f]"
        >
          <ReceiptText :size="15" /> Transaksi saya hari ini <strong>{{ todayMyTransactionsCount }}</strong>
        </div>
      </div>
      <div class="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <section class="rounded-xl border border-[#f0e2da] bg-white shadow-sm">
          <div class="flex flex-col gap-3 border-b border-[#f0e2da] bg-[#fffaf7] p-4 sm:flex-row">
            <label
              class="flex flex-1 items-center gap-2 rounded-lg border border-[#eadfd8] bg-white px-3 py-2 text-xs text-[#9b877b]"
              ><Search :size="15" /><input
                v-model="query"
                class="w-full bg-transparent outline-none placeholder:text-[#b6a49b]"
                type="search"
                placeholder="Cari nama produk atau motif" /></label
            ><select
              v-model="category"
              class="rounded-lg border border-[#eadfd8] bg-white px-3 py-2 text-xs text-[#705b50]"
            >
              <option>Semua produk</option>
              <option>Kemeja</option>
              <option>Blus & Outer</option>
              <option>Kain</option>
            </select>
          </div>
          <div class="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <button
              v-for="product in filteredProducts"
              :key="product.name"
              class="group text-left"
              type="button"
              @click="openProduct(product)"
            >
              <div
                class="relative flex aspect-[1.15] items-end overflow-hidden rounded-lg bg-[#ead8cc] p-4 transition group-hover:bg-[#e4cabc]"
              >
                <div
                  class="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.65),transparent_32%),repeating-linear-gradient(125deg,transparent_0_18px,rgba(108,57,37,.08)_19px_21px)]"
                ></div>
                <span
                  class="relative rounded bg-white/80 px-2 py-1 text-[.65rem] font-bold uppercase tracking-wider text-[#70412f]"
                  >Batik Nusantara</span
                >
              </div>
              <div class="pt-3">
                <div class="flex items-start justify-between gap-2">
                  <h2 class="text-sm font-bold text-[#33241e]">{{ product.name }}</h2>
                  <span class="text-[.68rem] text-[#a36a42]">★ {{ product.Rate }}</span>
                </div>
                <p class="mt-1 line-clamp-2 text-[.7rem] text-[#907c70]">
                  {{ product.deskription }}
                </p>
                <strong class="mt-2 block text-sm text-[#70412f]">{{
                  formatCurrency(product.price)
                }}</strong
                ><span class="mt-1 block text-[.65rem] text-[#9b877b]"
                  >Ukuran {{ product.size }}</span
                >
              </div>
            </button>
            <div
              v-if="!filteredProducts.length"
              class="col-span-full py-12 text-center text-xs text-[#907c70]"
            >
              Produk tidak ditemukan.
            </div>
          </div>
        </section>

        <aside class="sticky top-20 rounded-xl border border-[#f0e2da] bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-[#f0e2da] px-5 py-4">
            <div>
              <h2 class="font-serif text-xl text-[#33241e]">Pesanan saat ini</h2>
              <p class="mt-1 text-[.68rem] text-[#9b877b]">{{ totalItems }} item dipilih</p>
            </div>
            <ShoppingBag :size="19" class="text-[#b45c3a]" />
          </div>
          <div v-if="!cart.length" class="px-5 py-14 text-center">
            <ShoppingBag :size="30" class="mx-auto text-[#dbc7bc]" />
            <p class="mt-3 text-sm font-semibold text-[#60483b]">Keranjang masih kosong</p>
            <p class="mt-1 text-xs text-[#9b877b]">
              Pilih produk di sebelah kiri untuk memulai transaksi.
            </p>
          </div>
          <div v-else class="divide-y divide-[#f5ebe6]">
            <div v-for="item in cart" :key="item.cartId" class="flex gap-3 px-5 py-4">
              <div
                class="grid size-12 shrink-0 place-items-center rounded-lg bg-[#ead8cc] text-[.55rem] font-bold uppercase text-[#70412f]"
              >
                Batik
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-xs font-bold text-[#33241e]">{{ item.name }}</p>
                <p class="mt-1 text-[.65rem] text-[#9b877b]">
                  Ukuran {{ item.selectedSize }} · {{ formatCurrency(item.price) }}
                </p>
                <div class="mt-2 flex items-center gap-2">
                  <button
                    class="grid size-6 place-items-center rounded border border-[#eadfd8] text-[#705b50]"
                    type="button"
                    aria-label="Kurangi jumlah"
                    @click="updateQuantity(item, -1)"
                  >
                    <Minus :size="12" /></button
                  ><span class="w-5 text-center text-xs font-bold">{{ item.quantity }}</span
                  ><button
                    class="grid size-6 place-items-center rounded border border-[#eadfd8] text-[#705b50]"
                    type="button"
                    aria-label="Tambah jumlah"
                    @click="updateQuantity(item, 1)"
                  >
                    <Plus :size="12" /></button
                  ><button
                    class="ml-auto text-[#b98c7c]"
                    type="button"
                    aria-label="Hapus produk"
                    @click="cart = cart.filter((cartItem) => cartItem.cartId !== item.cartId)"
                  >
                    <Trash2 :size="14" />
                  </button>
                </div>
              </div>
              <strong class="text-xs text-[#60483b]">{{
                formatCurrency(item.price * item.quantity)
              }}</strong>
            </div>
          </div>
          <div class="border-t border-[#f0e2da] px-5 py-4">
            <div class="space-y-2 text-xs text-[#806b60]">
              <div class="flex justify-between">
                <span>Subtotal</span
                ><strong class="text-[#60483b]">{{ formatCurrency(subtotal) }}</strong>
              </div>
              <div class="flex justify-between">
                <span>Biaya layanan</span
                ><strong class="text-[#60483b]">{{ formatCurrency(serviceFee) }}</strong>
              </div>
              <div
                class="flex justify-between border-t border-dashed border-[#eadfd8] pt-3 text-sm font-bold text-[#33241e]"
              >
                <span>Total pembayaran</span><strong>{{ formatCurrency(total) }}</strong>
              </div>
            </div>
            <div class="mt-5">
              <p class="mb-2 text-xs font-bold text-[#60483b]">Metode pembayaran</p>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="method in ['Tunai', 'QRIS', 'Kartu debit'] as PaymentMethod[]"
                  :key="method"
                  class="grid min-h-16 place-items-center gap-1 rounded-lg border px-2 py-2 text-[.65rem]"
                  :class="
                    paymentMethod === method
                      ? 'border-[#b45c3a] bg-[#fdf0e9] font-bold text-[#70412f]'
                      : 'border-[#eadfd8] text-[#806b60]'
                  "
                  type="button"
                  @click="paymentMethod = method"
                >
                  <Banknote v-if="method === 'Tunai'" :size="16" /><Smartphone
                    v-else-if="method === 'QRIS'"
                    :size="16"
                  /><CreditCard v-else :size="16" />{{ method }}
                </button>
              </div>
            </div>
            <div v-if="paymentMethod === 'Tunai'" class="mt-4">
              <label class="mb-2 block text-xs font-bold text-[#60483b]" for="cash-received"
                >Uang diterima</label
              ><input
                id="cash-received"
                v-model.number="cashReceived"
                class="w-full rounded-lg border border-[#eadfd8] px-3 py-2.5 text-sm text-[#33241e] outline-none focus:border-[#b45c3a]"
                type="number"
                min="0"
                placeholder="Rp 0"
              />
              <div class="mt-2 flex justify-between text-xs text-[#9b877b]">
                <span>Kembalian</span
                ><strong class="text-emerald-700">{{ formatCurrency(change) }}</strong>
              </div>
            </div>
            <button
              class="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#4a2b1e] px-4 py-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              type="button"
              :disabled="!cart.length || (paymentMethod === 'Tunai' && cashReceived < total)"
              @click="completeCheckout"
            >
              <Check :size="16" /> Bayar & Selesaikan
            </button>
          </div>
        </aside>
      </div>
    </div>
    <div
      v-if="selectedProduct"
      class="fixed inset-0 z-40 grid place-items-center bg-[#33241e]/40 p-4"
      @click.self="selectedProduct = null"
    >
      <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-[.65rem] font-bold uppercase tracking-wider text-[#b45c3a]">
              Pilih varian
            </p>
            <h2 class="mt-1 font-serif text-2xl text-[#33241e]">{{ selectedProduct.name }}</h2>
            <p class="mt-2 text-xs text-[#907c70]">{{ formatCurrency(selectedProduct.price) }}</p>
          </div>
          <button
            class="text-[#806b60]"
            type="button"
            aria-label="Tutup"
            @click="selectedProduct = null"
          >
            <X :size="18" />
          </button>
        </div>
        <p class="mt-6 text-xs font-bold text-[#60483b]">Ukuran</p>
        <div class="mt-2 grid grid-cols-3 gap-2">
          <button
            v-for="size in selectedProduct.size.split('-').map((item) => item.trim())"
            :key="size"
            class="rounded-lg border px-3 py-2 text-xs"
            :class="
              selectedSize === size
                ? 'border-[#b45c3a] bg-[#fdf0e9] font-bold text-[#70412f]'
                : 'border-[#eadfd8] text-[#806b60]'
            "
            type="button"
            @click="selectedSize = size"
          >
            {{ size }}
          </button>
        </div>
        <button
          class="mt-6 w-full rounded-lg bg-[#4a2b1e] px-4 py-3 text-xs font-bold text-white"
          type="button"
          @click="addToCart"
        >
          <Plus :size="15" class="mr-1 inline" /> Tambahkan ke pesanan
        </button>
      </div>
    </div>
    <div
      v-if="checkoutComplete"
      class="fixed inset-0 z-50 grid place-items-center bg-[#33241e]/40 p-4"
    >
      <div class="w-full max-w-sm rounded-xl bg-white p-7 text-center shadow-2xl">
        <div
          class="mx-auto grid size-14 place-items-center rounded-full bg-emerald-50 text-emerald-700"
        >
          <Check :size="28" />
        </div>
        <h2 class="mt-4 font-serif text-2xl text-[#33241e]">Pembayaran berhasil</h2>
        <p class="mt-2 text-xs text-[#907c70]">
          Transaksi telah dicatat dan siap diberikan kepada pelanggan.
        </p>
        <div class="mt-5 rounded-lg bg-[#fffaf7] p-3 text-sm font-bold text-[#60483b]">
          {{ formatCurrency(total) }}
        </div>
        <button
          class="mt-5 w-full rounded-lg bg-[#4a2b1e] px-4 py-3 text-xs font-bold text-white"
          type="button"
          @click="newTransaction"
        >
          Buat transaksi baru
        </button>
      </div>
    </div>
  </DashboardTemplate>
</template>
