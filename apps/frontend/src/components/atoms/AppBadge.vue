<script setup lang="ts">
defineProps<{ label: string }>()
</script>

<template>
  <span
    class="inline-flex items-center gap-2 rounded-full border border-amber-300/30 px-3 py-1.5 text-[.7rem] font-bold uppercase tracking-[.08em] text-amber-200"
  >
    <span class="size-1.5 rounded-full bg-amber-400 shadow-[0_0_0_4px_rgba(251,191,36,.12)]"></span>
    {{ label }}
  </span>
</template>
