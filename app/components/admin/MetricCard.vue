<template>
  <article class="metric-card" :style="{ '--accent': accent }">
    <div class="card-top">
      <div class="icon-wrap">{{ icon }}</div>
      <span v-if="trend !== undefined" class="trend" :class="trend >= 0 ? 'up' : 'down'">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path :d="trend >= 0 ? 'M5 8V2M2 5l3-3 3 3' : 'M5 2v6M2 5l3 3 3-3'" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        {{ Math.abs(trend) }}%
      </span>
    </div>
    <div class="card-value">{{ value }}</div>
    <div class="card-label">{{ label }}</div>
    <div v-if="sub" class="card-sub">{{ sub }}</div>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  icon: string
  label: string
  value: string | number
  sub?: string
  trend?: number
  accent?: string
}>()
</script>

<style scoped>
.metric-card {
  --accent: #6366f1;
  background: #ffffff;
  border: 1px solid #f1f3f4;
  border-top: 3px solid var(--accent);
  border-radius: 12px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: box-shadow 0.15s, transform 0.15s;
  cursor: default;
}

.metric-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07);
  transform: translateY(-1px);
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.icon-wrap {
  font-size: 1.3rem;
  line-height: 1;
}

.trend {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 999px;
  padding: 3px 8px;
}

.trend.up {
  color: #16a34a;
  background: #f0fdf4;
}

.trend.down {
  color: #dc2626;
  background: #fef2f2;
}

.card-value {
  font-size: 2rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -1px;
  color: #111827;
}

.card-label {
  font-size: 0.85rem;
  color: #374151;
  font-weight: 500;
}

.card-sub {
  font-size: 0.78rem;
  color: #9ca3af;
}
</style>
