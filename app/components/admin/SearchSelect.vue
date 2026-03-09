<template>
  <div class="search-select" :class="[`search-select--${size}`, { 'search-select--disabled': disabled }]">
    <select
      :value="selectedValue"
      class="search-select__native"
      :disabled="disabled"
      @change="onChange"
    >
      <option
        v-if="showPlaceholderOption"
        value=""
      >
        {{ placeholder }}
      </option>
      <option
        v-for="(opt, idx) in options"
        :key="`${String(opt.value)}-${idx}`"
        :value="String(opt.value)"
      >
        {{ opt.label }}
      </option>
    </select>
    <span class="search-select__arrow" aria-hidden="true">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type SelectOption = {
  label: string
  value: string | number
}

const props = withDefaults(defineProps<{
  modelValue: string | number | null | undefined
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  searchable?: boolean
  clearable?: boolean
  size?: 'sm' | 'md'
}>(), {
  placeholder: 'เลือกข้อมูล',
  disabled: false,
  searchable: false,
  clearable: false,
  size: 'md',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
}>()

const selectedValue = computed(() => String(props.modelValue ?? ''))

const showPlaceholderOption = computed(() => {
  return !props.options.some(opt => String(opt.value) === '')
})

function onChange(event: Event) {
  const selected = (event.target as HTMLSelectElement).value
  const found = props.options.find(opt => String(opt.value) === selected)
  if (found) {
    emit('update:modelValue', found.value)
    return
  }
  emit('update:modelValue', '')
}
</script>

<style scoped>
.search-select {
  position: relative;
  width: 100%;
}

.search-select__native {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  outline: none;
  background: #fff;
  font-size: 0.875rem;
  color: #111827;
  padding: 8px 34px 8px 12px;
  font-family: inherit;
  min-height: 38px;
  appearance: none;
  cursor: pointer;
  transition: border-color 0.12s, box-shadow 0.12s;
}

.search-select__native:disabled {
  background: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}

.search-select__native:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.search-select__native:hover:not(:disabled) {
  border-color: #9ca3af;
}

.search-select__arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  right: 10px;
  color: #6b7280;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.search-select--sm .search-select__native {
  font-size: 0.8rem;
  min-height: 32px;
  padding: 6px 30px 6px 10px;
}

.search-select--sm .search-select__arrow {
  right: 9px;
}
</style>
