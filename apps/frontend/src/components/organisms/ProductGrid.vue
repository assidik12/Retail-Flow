<script setup lang="ts">
import ProductCard from '@/components/molecules/ProductCard.vue'

interface Product {
  name: string
  price: number
  size: string
  Rate: string
  deskription: string
}
defineProps<{ products: Product[]; images: string[] }>()
const emit = defineEmits<{ select: [product: Product] }>()
</script>

<template>
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
    <ProductCard
      v-for="(product, index) in products"
      :key="product.name"
      :product="product"
      :image="images[index] ?? images[0] ?? ''"
      :tone="index % 2 === 0 ? '#e9dfd0' : '#ddd3c8'"
      @select="emit('select', $event)"
    />
  </div>
</template>
