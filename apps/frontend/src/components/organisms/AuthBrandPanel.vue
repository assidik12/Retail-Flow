<script setup lang="ts">
import { ArrowUpRight, Shirt } from 'lucide-vue-next'
import AppBadge from '@/components/atoms/AppBadge.vue'
</script>

<template>
  <section class="relative min-h-[21rem] overflow-hidden bg-slate-900 text-white lg:min-h-screen">
    <div
      class="pointer-events-none absolute -inset-[14%] rotate-[28deg] rounded-[48%_52%_45%_55%] border border-amber-400/25 opacity-90"
      aria-hidden="true"
    ></div>
    <div
      class="pointer-events-none absolute inset-[12%] rotate-[42deg] rounded-[48%_52%_45%_55%] border border-amber-400/25"
      aria-hidden="true"
    ></div>
    <div
      class="pointer-events-none absolute inset-[24%] -rotate-14 rounded-[48%_52%_45%_55%] border border-amber-400/25"
      aria-hidden="true"
    ></div>
    <div
      class="relative z-10 flex min-h-[21rem] flex-col justify-between p-8 sm:p-12 lg:min-h-screen lg:p-[clamp(2rem,6vw,5rem)]"
    >
      <div class="flex items-center gap-3 text-base font-bold tracking-wide">
        <div
          class="grid size-10 place-items-center rounded-xl border border-white/30 text-amber-400"
        >
          <Shirt :size="22" stroke-width="1.8" />
        </div>
        <span>Retail Flow</span>
      </div>
      <div class="max-w-lg">
        <AppBadge label="Batik retail operations" />
        <h1
          class="my-5 max-w-xl text-[clamp(2.7rem,5vw,5.5rem)] font-normal leading-[.98] tracking-[-.055em]"
        >
          Jaga ritme toko, <em class="text-amber-400 not-italic">rawat detailnya.</em>
        </h1>
        <p class="max-w-md text-base leading-7 text-slate-300">
          Ruang kerja digital untuk kasir yang bergerak cepat dan keputusan stok yang lebih rapi.
        </p>
      </div>
      <div class="flex items-center justify-between text-xs text-slate-400">
        <span>Retail Flow Batik · Est. 2024</span><ArrowUpRight :size="18" aria-hidden="true" />
      </div>
    </div>
  </section>
</template>
