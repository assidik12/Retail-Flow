<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ImagePlus, UploadCloud, X } from 'lucide-vue-next'
import AppButton from '@/components/atoms/AppButton.vue'
import AppInput from '@/components/atoms/AppInput.vue'
import FormField from '@/components/molecules/FormField.vue'
import type { ProductDraft, ProductRecord } from '@/features/dashboard/types'

const props = withDefaults(
  defineProps<{ open: boolean; product: ProductRecord | null; viewOnly?: boolean }>(),
  {
    viewOnly: false,
  },
)
const emit = defineEmits<{ close: []; save: [draft: ProductDraft] }>()
const name = ref('')
const sku = ref('')
const category = ref('Batik Tulis')
const costPrice = ref('')
const price = ref('')
const size = ref('S - XXL')
const description = ref('')
const image = ref('')
const submitted = ref(false)
const stockBySize = ref<Record<string, number>>({ S: 0, M: 0, L: 0, XL: 0, XXL: 0 })
const totalStock = computed(() =>
  Object.values(stockBySize.value).reduce((sum, value) => sum + Number(value || 0), 0),
)

watch(
  () => props.product,
  (product) => {
    name.value = product?.name ?? ''
    sku.value = product?.sku ?? ''
    category.value = product?.category ?? 'Batik Tulis'
    costPrice.value = product ? String(product.costPrice) : ''
    price.value = product ? String(product.price) : ''
    size.value = product?.size ?? 'S - XXL'
    description.value = product?.deskription ?? ''
    image.value = product?.image ?? ''
    stockBySize.value = product?.stockBySize ?? { S: 0, M: 0, L: 0, XL: 0, XXL: 0 }
    submitted.value = false
  },
  { immediate: true },
)

const onImageUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => (image.value = String(reader.result ?? ''))
  reader.readAsDataURL(file)
}
const save = () => {
  submitted.value = true
  if (!name.value.trim() || !sku.value.trim() || !costPrice.value || !price.value) return
  emit('save', {
    name: name.value.trim(),
    sku: sku.value.trim().toUpperCase(),
    category: category.value,
    costPrice: Number(costPrice.value) || 0,
    price: Number(price.value) || 0,
    size: size.value,
    stock: totalStock.value,
    stockBySize: stockBySize.value,
    image: image.value,
    deskription: description.value,
  })
}
</script>

<template>
  <Transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex justify-end bg-slate-950/40"
      @click.self="emit('close')"
    >
      <section class="h-full w-full max-w-2xl overflow-y-auto bg-white p-6 shadow-2xl sm:p-8">
        <div class="mb-7 flex items-start justify-between">
          <div>
            <p class="mb-1 text-[.65rem] font-bold uppercase tracking-wider text-slate-500">
              Product catalog
            </p>
            <h2 class="font-serif text-2xl text-slate-950">
              {{ viewOnly ? 'Detail produk' : product ? 'Edit produk' : 'Tambah produk baru' }}
            </h2>
          </div>
          <button
            class="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
            type="button"
            aria-label="Tutup dialog"
            @click="emit('close')"
          >
            <X :size="17" />
          </button>
        </div>
        <form class="grid gap-5" @submit.prevent="save">
          <label
            class="relative grid min-h-36 cursor-pointer place-items-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:border-slate-500"
          >
            <img
              v-if="image"
              :src="image"
              alt="Product preview"
              class="absolute inset-0 size-full object-cover"
            />
            <span
              class="relative grid place-items-center gap-2 rounded-lg bg-white/90 px-4 py-3 text-center text-xs shadow-sm"
              ><UploadCloud v-if="!image" :size="22" /><ImagePlus v-else :size="20" />{{
                image ? 'Ganti gambar produk' : 'Upload gambar produk'
              }}<small class="text-[.65rem] text-slate-400">PNG, JPG hingga 5 MB</small></span
            >
            <input
              class="sr-only"
              type="file"
              accept="image/png,image/jpeg"
              :disabled="viewOnly"
              @change="onImageUpload"
            />
          </label>
          <div class="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Product name"
              for-id="product-name"
              :error="submitted && !name.trim() ? 'Nama produk wajib diisi.' : undefined"
              ><AppInput
                id="product-name"
                v-model="name"
                :disabled="viewOnly"
                placeholder="Kemeja Parang Sagara"
            /></FormField>
            <FormField
              label="SKU"
              for-id="product-sku"
              :error="submitted && !sku.trim() ? 'SKU wajib diisi.' : undefined"
              ><AppInput id="product-sku" v-model="sku" :disabled="viewOnly" placeholder="BTK-001"
            /></FormField>
          </div>
          <div class="grid gap-4 sm:grid-cols-3">
            <FormField label="Category" for-id="product-category"
              ><select
                id="product-category"
                v-model="category"
                :disabled="viewOnly"
                class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-slate-700"
              >
                <option>Batik Tulis</option>
                <option>Batik Cap</option>
                <option>Kain</option>
              </select></FormField
            >
            <FormField
              label="Harga beli"
              for-id="product-cost"
              :error="submitted && !costPrice ? 'Harga beli wajib diisi.' : undefined"
              ><AppInput
                id="product-cost"
                v-model="costPrice"
                :disabled="viewOnly"
                type="number"
                placeholder="150000"
            /></FormField>
            <FormField
              label="Harga jual"
              for-id="product-price"
              :error="submitted && !price ? 'Harga jual wajib diisi.' : undefined"
              ><AppInput
                id="product-price"
                v-model="price"
                :disabled="viewOnly"
                type="number"
                placeholder="250000"
            /></FormField>
          </div>
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div class="mb-3 flex items-center justify-between">
              <p class="text-xs font-bold text-slate-800">Variant stock</p>
              <span class="text-xs text-slate-500">Total {{ totalStock }} pcs</span>
            </div>
            <div class="grid grid-cols-5 gap-2">
              <label
                v-for="variant in ['S', 'M', 'L', 'XL', 'XXL']"
                :key="variant"
                class="grid gap-1 text-[.65rem] font-semibold text-slate-600"
                >{{ variant
                }}<input
                  v-model.number="stockBySize[variant]"
                  :disabled="viewOnly"
                  class="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm text-slate-900 outline-none focus:border-slate-700"
                  type="number"
                  min="0"
              /></label>
            </div>
          </div>
          <FormField label="Description" for-id="product-description">
            <textarea
              id="product-description"
              v-model="description"
              :disabled="viewOnly"
              rows="4"
              class="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-700"
              placeholder="Deskripsikan karakter produk"
            ></textarea>
          </FormField>
          <div class="mt-2 flex justify-end gap-2 border-t border-slate-200 pt-5">
            <AppButton variant="ghost" type="button" @click="emit('close')">Tutup</AppButton
            ><AppButton v-if="!viewOnly" type="submit">{{
              product ? 'Simpan perubahan' : 'Tambah produk'
            }}</AppButton>
          </div>
        </form>
      </section>
    </div>
  </Transition>
</template>
