<script setup lang="ts">
import { ArrowDownUp, Eye, Pencil, Trash2 } from 'lucide-vue-next'
import type { ProductRecord } from '@/features/dashboard/types'

defineProps<{
  products: ProductRecord[]
  formatCurrency: (value: number) => string
  sortKey: keyof ProductRecord | null
  sortDirection: 'asc' | 'desc'
}>()
const emit = defineEmits<{
  edit: [product: ProductRecord]
  remove: [product: ProductRecord]
  view: [product: ProductRecord]
  sort: [key: keyof ProductRecord]
}>()
const stockLabel = (stock: number) =>
  stock === 0 ? 'Out of stock' : stock <= 10 ? 'Low stock' : 'In stock'
const stockClass = (stock: number) =>
  stock === 0
    ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200'
    : stock <= 10
      ? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200'
      : 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200'
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full min-w-245 border-collapse text-left text-xs">
      <thead>
        <tr
          class="border-b border-slate-200 bg-slate-50 text-[.62rem] uppercase tracking-wider text-slate-500"
        >
          <th class="px-5 py-3 font-bold">Product</th>
          <th class="px-5 py-3 font-bold">SKU</th>
          <th class="px-5 py-3 font-bold">Category</th>
          <th class="px-5 py-3 font-bold">Price</th>
          <th class="px-5 py-3 font-bold">Total stock</th>
          <th class="px-5 py-3 font-bold">Status</th>
          <th class="px-5 py-3 text-right font-bold">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="product in products"
          :key="product.id"
          class="border-b border-[#f2e8e2] transition hover:bg-[#fffaf7]"
        >
          <td class="px-5 py-4">
            <div class="flex items-center gap-3">
              <div
                class="grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100 text-[.55rem] font-bold uppercase text-slate-500"
              >
                <img
                  v-if="product.image"
                  :src="product.image"
                  :alt="product.name"
                  class="size-full object-cover"
                />
                <span v-else>batik</span>
              </div>
              <div class="min-w-0">
                <strong class="block truncate font-semibold text-slate-900">{{
                  product.name
                }}</strong
                ><span class="mt-1 block max-w-55 truncate text-[.68rem] text-slate-500">{{
                  product.deskription
                }}</span>
              </div>
            </div>
          </td>
          <td class="px-5 py-4 font-mono text-[.68rem] font-bold text-slate-600">
            {{ product.sku }}
          </td>
          <td class="px-5 py-4">
            <span
              class="rounded-md bg-slate-100 px-2 py-1 text-[.65rem] font-medium text-slate-700"
              >{{ product.category }}</span
            >
          </td>
          <td class="px-5 py-4 font-semibold text-slate-900">
            {{ formatCurrency(product.price) }}
          </td>
          <td class="px-5 py-4">
            <button
              class="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-950"
              type="button"
              @click="emit('sort', 'stock')"
            >
              {{ product.stock }} pcs <ArrowDownUp :size="12" class="text-slate-400" />
            </button>
          </td>
          <td class="px-5 py-4">
            <span
              class="rounded-full px-2.5 py-1 text-[.65rem] font-semibold"
              :class="stockClass(product.stock)"
              >{{ stockLabel(product.stock) }}</span
            >
          </td>
          <td class="px-5 py-4">
            <div class="flex justify-end gap-1">
              <button
                class="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                type="button"
                title="View product"
                @click="emit('view', product)"
              >
                <Eye :size="15" /></button
              ><button
                class="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                type="button"
                title="Edit product"
                @click="emit('edit', product)"
              >
                <Pencil :size="15" /></button
              ><button
                class="grid size-8 place-items-center rounded-lg text-red-600 hover:bg-red-50"
                type="button"
                title="Delete product"
                @click="emit('remove', product)"
              >
                <Trash2 :size="15" />
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="!products.length">
          <td colspan="7" class="px-5 py-14 text-center text-sm text-slate-500">
            Produk tidak ditemukan.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
