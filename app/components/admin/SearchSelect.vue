<template>
  <div
    ref="rootRef"
    class="search-select"
    :class="[
      `search-select--${size}`,
      { 'search-select--open': isOpen, 'search-select--disabled': disabled },
    ]"
  >
    <div class="search-select__control" @click="toggleOpen">
      <input
        ref="inputRef"
        v-model="query"
        class="search-select__input"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="!searchable"
        @focus="open"
        @input="onInput"
        @keydown.down.prevent="moveActive(1)"
        @keydown.up.prevent="moveActive(-1)"
        @keydown.enter.prevent="selectActive"
        @keydown.esc.prevent="close"
      >
      <button
        v-if="clearable && !disabled && modelValue !== null && modelValue !== undefined && String(modelValue) !== ''"
        type="button"
        class="search-select__clear"
        @click.stop="clearValue"
      >
        x
      </button>
      <span class="search-select__arrow" aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
    </div>

    <div v-if="isOpen" class="search-select__dropdown">
      <button
        v-for="(opt, idx) in filteredOptions"
        :key="`${String(opt.value)}-${idx}`"
        type="button"
        class="search-select__option"
        :class="{ 'search-select__option--active': idx === activeIndex }"
        @click="selectOption(opt)"
        @mouseenter="activeIndex = idx"
      >
        {{ opt.label }}
      </button>
      <div v-if="filteredOptions.length === 0" class="search-select__empty">ไม่พบข้อมูล</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

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
  searchable: true,
  clearable: false,
  size: 'md',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
}>()

const rootRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const isOpen = ref(false)
const query = ref('')
const activeIndex = ref(0)

const selectedOption = computed(() => props.options.find(opt => opt.value === props.modelValue) || null)

const filteredOptions = computed(() => {
  if (!props.searchable) return props.options
  const q = query.value.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter(opt => opt.label.toLowerCase().includes(q))
})

function syncQueryFromModel() {
  query.value = selectedOption.value?.label || ''
}

watch(() => props.modelValue, syncQueryFromModel, { immediate: true })
watch(() => props.options, () => {
  syncQueryFromModel()
})

watch(filteredOptions, (list) => {
  if (list.length === 0) {
    activeIndex.value = 0
    return
  }
  if (activeIndex.value >= list.length) activeIndex.value = list.length - 1
})

function open() {
  if (props.disabled) return
  isOpen.value = true
}

function close() {
  isOpen.value = false
  syncQueryFromModel()
}

async function toggleOpen() {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    await nextTick()
    inputRef.value?.focus()
  }
}

function onInput() {
  if (!isOpen.value) isOpen.value = true
  activeIndex.value = 0
}

function selectOption(opt: SelectOption) {
  emit('update:modelValue', opt.value)
  query.value = opt.label
  isOpen.value = false
}

function moveActive(step: number) {
  if (!isOpen.value) {
    open()
    return
  }
  if (filteredOptions.value.length === 0) return
  const next = activeIndex.value + step
  if (next < 0) activeIndex.value = filteredOptions.value.length - 1
  else if (next >= filteredOptions.value.length) activeIndex.value = 0
  else activeIndex.value = next
}

function selectActive() {
  if (!isOpen.value) {
    open()
    return
  }
  const target = filteredOptions.value[activeIndex.value]
  if (target) selectOption(target)
}

function clearValue() {
  const emptyOption = props.options.find(opt => String(opt.value) === '')
  emit('update:modelValue', emptyOption ? emptyOption.value : '')
  query.value = ''
  isOpen.value = false
}

function handleClickOutside(event: MouseEvent) {
  const node = event.target as Node
  if (rootRef.value && !rootRef.value.contains(node)) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.search-select {
  position: relative;
  width: 100%;
}

.search-select__control {
  position: relative;
  display: flex;
  align-items: center;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  min-height: 38px;
  cursor: text;
}

.search-select__input {
  width: 100%;
  border: 0;
  outline: none;
  background: transparent;
  font-size: 0.875rem;
  color: #111827;
  padding: 8px 34px 8px 12px;
  font-family: inherit;
}

.search-select__input:disabled {
  color: #9ca3af;
  cursor: not-allowed;
}

.search-select__arrow {
  position: absolute;
  right: 10px;
  color: #6b7280;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.search-select__clear {
  position: absolute;
  right: 26px;
  border: 0;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  font-size: 0.8rem;
  line-height: 1;
  padding: 2px;
}

.search-select__dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 220px;
  overflow: auto;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(17, 24, 39, 0.08);
  z-index: 30;
}

.search-select__option {
  width: 100%;
  border: 0;
  background: #fff;
  color: #111827;
  text-align: left;
  padding: 8px 12px;
  font-size: 0.875rem;
  cursor: pointer;
}

.search-select__option:hover,
.search-select__option--active {
  background: #f3f4f6;
}

.search-select__empty {
  padding: 10px 12px;
  color: #9ca3af;
  font-size: 0.82rem;
}

.search-select--disabled .search-select__control {
  background: #f9fafb;
  cursor: not-allowed;
}

.search-select--open .search-select__control {
  border-color: #6366f1;
}

.search-select--sm .search-select__control {
  min-height: 32px;
  border-radius: 8px;
}

.search-select--sm .search-select__input {
  font-size: 0.8rem;
  padding: 6px 30px 6px 10px;
}

.search-select--sm .search-select__option {
  font-size: 0.8rem;
  padding: 7px 10px;
}

.search-select--sm .search-select__arrow {
  right: 9px;
}
</style>
