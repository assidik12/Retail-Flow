<script setup lang="ts">
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  UsersRound,
} from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { getSession } from '@/features/auth/auth.service'

const isOwner = getSession()?.role === 'owner'
</script>
<template>
  <aside class="hidden w-64 shrink-0 flex-col border-r border-[#eadfd8] bg-[#fff8f4] lg:flex">
    <div class="border-b border-[#eadfd8] px-6 py-5">
      <RouterLink to="/" class="flex items-center gap-2 text-[#35261f] no-underline"
        ><span
          class="grid size-8 place-items-center rounded-lg bg-[#4a2b1e] text-[.58rem] font-bold text-white"
          >RF</span
        ><span
          ><strong class="block font-serif text-sm">Retail Flow</strong
          ><small class="block text-[.52rem] uppercase tracking-widest text-[#b45c3a]"
            >Batik Nusantara</small
          ></span
        ></RouterLink
      >
    </div>
    <div class="px-5 pb-2 pt-7 text-[.6rem] font-bold uppercase tracking-[.16em] text-[#a89184]">
      Modul utama sistem
    </div>
    <nav class="flex flex-1 flex-col gap-1 px-3 text-xs">
      <RouterLink
        to="/dashboard"
        class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[#6c5b52] hover:bg-[#f9e8df]"
        v-if="isOwner"
        active-class="bg-[#f1d7cb] font-semibold text-[#5b2e20]"
        ><LayoutDashboard :size="16" /> Dashboard</RouterLink
      >
      <RouterLink
        to="/cashier"
        class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[#6c5b52] hover:bg-[#f9e8df]"
        v-if="!isOwner"
        active-class="bg-[#f1d7cb] font-semibold text-[#5b2e20]"
        ><ShoppingCart :size="16" /> Produk</RouterLink
      >
      <RouterLink
        to="/admin/products"
        class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[#6c5b52] hover:bg-[#f9e8df]"
        v-if="isOwner"
        active-class="bg-[#f1d7cb] font-semibold text-[#5b2e20]"
        ><Package :size="16" /> Manajemen Produk & Stok</RouterLink
      >
      <RouterLink
        to="/admin/cashiers"
        v-if="isOwner"
        class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[#6c5b52] hover:bg-[#f9e8df]"
        active-class="bg-[#f1d7cb] font-semibold text-[#5b2e20]"
        ><UsersRound :size="16" /> Manajemen Kasir</RouterLink
      >
      <RouterLink
        to="/history"
        class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[#6c5b52] hover:bg-[#f9e8df]"
        active-class="bg-[#f1d7cb] font-semibold text-[#5b2e20]"
      >
        <ClipboardList :size="16" /> Riwayat Transaksi
      </RouterLink>
      <div
        v-if="isOwner"
        class="flex items-center justify-between rounded-lg px-3 py-2.5 text-[#a89184] cursor-not-allowed opacity-60"
        title="Fitur ini sedang dalam pengembangan (API belum tersedia)"
      >
        <span class="flex items-center gap-3"><BarChart3 :size="16" /> Laporan & Shift Kasir</span>
        <span class="rounded bg-[#eadfd8] px-1.5 py-0.5 text-[0.6rem] font-bold text-[#806b60]">Soon</span>
      </div>
    </nav>
    <div class="space-y-3 border-t border-[#eadfd8] p-4 text-xs">
      <a href="#settings" class="flex items-center gap-3 text-[#6c5b52]"
        ><Settings :size="15" /> Pengaturan</a
      ><RouterLink to="/" class="flex items-center gap-3 text-[#8d776b] no-underline"
        ><LogOut :size="15" /> Keluar ke toko</RouterLink
      >
    </div>
  </aside>
</template>
