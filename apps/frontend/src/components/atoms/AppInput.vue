<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: string
    type?: string
    placeholder?: string
    autocomplete?: string
    id?: string
  }>(),
  { type: 'text', placeholder: '', autocomplete: 'off', id: undefined },
)

defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <input
    :id="id"
    class="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
    :type="type"
    :value="modelValue"
    :placeholder="placeholder"
    :autocomplete="autocomplete"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
