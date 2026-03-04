<template>
  <Teleport to="body">
    <Transition name="overlay">
      <div v-if="modelValue" class="overlay" @mousedown.self="$emit('update:modelValue', false)">
          <div class="confirm-modal">
            <div class="danger-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 9v4M12 17h.01" stroke="#ef4444" stroke-width="2" stroke-linecap="round" />
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#ef4444" stroke-width="1.6" fill="none" stroke-linejoin="round" />
              </svg>
            </div>
            <h3 class="confirm-title">{{ title ?? 'ยืนยันการลบ?' }}</h3>
            <p class="confirm-desc">{{ description ?? 'ข้อมูลนี้จะถูกลบถาวรและไม่สามารถกู้คืนได้' }}</p>
            <div class="confirm-footer">
              <button type="button" class="btn btn-ghost" @click="$emit('update:modelValue', false)">ยกเลิก</button>
              <button type="button" class="btn btn-danger" @click="$emit('confirm')">{{ confirmLabel ?? 'ลบข้อมูล' }}</button>
            </div>
          </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean
  title?: string
  description?: string
  confirmLabel?: string
}>()

defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'confirm'): void
}>()
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.confirm-modal {
  background: #fff;
  border-radius: 14px;
  padding: 28px 28px 24px;
  max-width: 380px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
  gap: 6px;
}

.danger-icon {
  width: 52px;
  height: 52px;
  background: #fef2f2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.confirm-title {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.confirm-desc {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
  margin: 4px 0 12px;
}

.confirm-footer {
  display: flex;
  gap: 8px;
  width: 100%;
  justify-content: center;
}

.btn {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  font-family: inherit;
  transition: background 0.1s;
}

.btn-ghost {
  background: #fff;
  color: #374151;
  border-color: #d1d5db;
}

.btn-ghost:hover {
  background: #f9fafb;
}

.btn-danger {
  background: #ef4444;
  color: #fff;
  border-color: #ef4444;
}

.btn-danger:hover {
  background: #dc2626;
}

.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.16s;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.16s, transform 0.16s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.94);
}
</style>
