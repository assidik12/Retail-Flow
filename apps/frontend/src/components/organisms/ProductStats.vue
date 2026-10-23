<script setup lang="ts">
import { AlertTriangle, Boxes, CircleDollarSign, PackageX } from 'lucide-vue-next'

defineProps<{
  totalProducts: number
  inventoryValue: number
  lowStock: number
  outOfStock: number
  formatCurrency: (value: number) => string
}>()
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <article class="rounded-xl border border-[#f0e2da] bg-white p-4 shadow-sm">
      <div
        class="mb-4 flex items-center justify-between text-[.62rem] font-bold uppercase tracking-wider text-[#876e62]"
      >
        <span>Total produk katalog</span><Boxes :size="17" class="text-[#bd7557]" />
      </div>
      <strong class="block text-2xl font-semibold text-[#33241e]"
        >{{ totalProducts }} <small class="text-xs font-normal text-[#a18d83]">SKU</small></strong
      >
      <div class="mt-4 h-1 rounded-full bg-[#f2e3dc]">
        <div class="h-1 w-3/4 rounded-full bg-[#cf704c]"></div>
      </div>
    </article>
    <article class="rounded-xl border border-[#f0e2da] bg-white p-4 shadow-sm">
      <div
        class="mb-4 flex items-center justify-between text-[.62rem] font-bold uppercase tracking-wider text-[#876e62]"
      >
        <span>Total nilai inventaris</span><CircleDollarSign :size="17" class="text-[#bd7557]" />
      </div>
      <strong class="block text-xl font-semibold text-[#33241e]">{{
        formatCurrency(inventoryValue)
      }}</strong>
      <p class="mt-3 text-[.62rem] text-[#a18d83]">Nilai stok aktif</p>
    </article>
    <article class="rounded-xl border border-[#f0e2da] bg-white p-4 shadow-sm">
      <div
        class="mb-4 flex items-center justify-between text-[.62rem] font-bold uppercase tracking-wider text-[#876e62]"
      >
        <span>Perhatian: stok menipis</span><AlertTriangle :size="17" class="text-[#c56b40]" />
      </div>
      <strong class="block text-2xl font-semibold text-[#b45309]"
        >{{ lowStock }} <small class="text-xs font-normal text-[#a18d83]">varian</small></strong
      >
      <p class="mt-3 text-[.62rem] text-[#a18d83]">Perlu restock segera</p>
    </article>
    <article class="rounded-xl border border-[#f0e2da] bg-white p-4 shadow-sm">
      <div
        class="mb-4 flex items-center justify-between text-[.62rem] font-bold uppercase tracking-wider text-[#876e62]"
      >
        <span>Kritis: stok habis</span><PackageX :size="17" class="text-rose-600" />
      </div>
      <strong class="block text-2xl font-semibold text-rose-700"
        >{{ outOfStock }} <small class="text-xs font-normal text-[#a18d83]">produk</small></strong
      >
      <p class="mt-3 text-[.62rem] text-[#a18d83]">Perlu tindakan segera</p>
    </article>
  </div>
</template>
