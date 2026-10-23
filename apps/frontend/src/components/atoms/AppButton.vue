<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: 'button' | 'submit'
    variant?: 'primary' | 'ghost'
    loading?: boolean
    disabled?: boolean
  }>(),
  { type: 'button', variant: 'primary', loading: false, disabled: false },
)
</script>

<template>
  <button
    :class="
      variant === 'primary'
        ? 'inline-flex w-full items-center justify-center gap-2 rounded-xl border-0 bg-slate-900 px-4 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70'
        : 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70'
    "
    :type="type"
    :disabled="disabled || loading"
  >
    <span
      v-if="loading"
      class="size-4 animate-spin rounded-full border-2 border-white/35 border-t-white"
      aria-hidden="true"
    ></span>
    <slot />
  </button>
</template>
