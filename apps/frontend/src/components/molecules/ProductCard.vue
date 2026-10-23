<script setup lang="ts">
import { ArrowUpRight, Heart, Star } from 'lucide-vue-next'
import { computed } from 'vue'

interface Product {
  name: string
  price: number
  size: string
  Rate: string
  deskription: string
}
const props = defineProps<{ product: Product; image: string; tone: string }>()
const emit = defineEmits<{ select: [product: Product] }>()
const formattedPrice = computed(() =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(props.product.price),
)
</script>

<template>
  <article class="group cursor-pointer" @click="emit('select', product)">
    <div
      :class="[
        'relative h-64 overflow-hidden sm:h-72',
        tone === '#e9dfd0' ? 'bg-[#e9dfd0]' : 'bg-[#ddd3c8]',
      ]"
    >
      <img
        :src="image"
        :alt="product.name"
        class="size-full object-cover mix-blend-multiply transition duration-500 group-hover:scale-105"
        loading="lazy"
      />
      <button
        class="absolute right-3 top-3 grid size-8 place-items-center rounded-full border-0 bg-white/80 text-[#34302c]"
        type="button"
        :aria-label="`Simpan ${product.name}`"
        @click.stop
      >
        <Heart :size="16" />
      </button>
      <span
        class="absolute bottom-3 left-3 bg-white/80 px-2 py-1 text-[.52rem] uppercase tracking-[.08em] text-[#5c5045]"
        >Nusantara edit</span
      >
    </div>
    <div class="px-0.5 py-3">
      <div class="flex items-center justify-between text-[.62rem] text-[#978b7f]">
        <span>{{ product.size }}</span
        ><span class="inline-flex items-center gap-1 text-[#ad5f25]"
          ><Star :size="12" fill="currentColor" /> {{ product.Rate }}</span
        >
      </div>
      <h3 class="my-1.5 font-serif text-base font-normal text-[#37312c]">{{ product.name }}</h3>
      <div class="flex items-center justify-between">
        <strong class="text-xs text-[#3f3731]">{{ formattedPrice }}</strong
        ><span
          class="grid size-7 place-items-center rounded-full border border-[#d9d0c6] text-[#ad5f25]"
          ><ArrowUpRight :size="16"
        /></span>
      </div>
    </div>
  </article>
</template>
