<template>
  <span class="badge" :class="`badge--${variant}`">{{ label }}</span>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  variant?: 'pending' | 'approved' | 'rejected' | 'info' | 'default'
}>()
</script>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 3px 10px;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
}

.badge--pending {
  background: #fefce8;
  color: #92400e;
  border: 1px solid #fde68a;
}

.badge--approved {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.badge--rejected {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.badge--info {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.badge--default {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
}
</style>
