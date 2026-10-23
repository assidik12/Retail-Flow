<script setup lang="ts">
defineProps<{ label: string; forId: string; hint?: string; error?: string }>()
</script>

<template>
  <div class="grid gap-2">
    <div class="flex items-center justify-between gap-4">
      <label class="text-xs font-bold text-slate-900" :for="forId">{{ label }}</label>
      <span v-if="hint" class="text-[.7rem] text-slate-400">{{ hint }}</span>
    </div>
    <slot />
    <p v-if="error" class="text-[.72rem] text-rose-700">{{ error }}</p>
  </div>
</template>
