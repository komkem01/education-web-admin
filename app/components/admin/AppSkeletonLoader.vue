<template>
  <div class="skeleton-page">
    <!-- Page header skeleton -->
    <div class="sk-header">
      <div class="sk-block" style="width: 180px; height: 24px;" />
      <div class="sk-block" style="width: 120px; height: 14px; margin-top: 8px;" />
    </div>

    <!-- Cards row (optional) -->
    <div v-if="showCards" class="sk-cards">
      <div v-for="i in 4" :key="i" class="sk-card">
        <div class="sk-block" style="width: 40px; height: 40px; border-radius: 10px;" />
        <div class="sk-block" style="width: 80px; height: 28px; margin-top: 10px;" />
        <div class="sk-block" style="width: 110px; height: 13px; margin-top: 8px;" />
      </div>
    </div>

    <!-- Table skeleton -->
    <div class="sk-table">
      <!-- table header -->
      <div class="sk-table-head">
        <div v-for="i in cols" :key="i" class="sk-block sk-th" />
      </div>
      <!-- table rows -->
      <div v-for="row in rows" :key="row" class="sk-table-row">
        <div v-for="c in cols" :key="c" class="sk-block sk-td" :style="{ width: randomWidth(c) }" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  showCards?: boolean
  rows?: number
  cols?: number
}>(), {
  showCards: false,
  rows: 5,
  cols: 5,
})

// Vary td widths slightly for visual realism
const widths = ['60%', '75%', '55%', '80%', '65%', '70%', '50%']
const randomWidth = (col: number) => widths[(col * 3 + props.rows) % widths.length]
</script>

<style scoped>
/* Shimmer keyframe */
@keyframes shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}

.sk-block {
  border-radius: 6px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e9eaec 50%, #f3f4f6 75%);
  background-size: 800px 100%;
  animation: shimmer 1.4s infinite linear;
}

.skeleton-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Header */
.sk-header {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* Cards */
.sk-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.sk-card {
  background: #fff;
  border: 1px solid #f1f3f4;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

/* Table */
.sk-table {
  background: #fff;
  border: 1px solid #f1f3f4;
  border-radius: 12px;
  overflow: hidden;
}

.sk-table-head {
  display: flex;
  gap: 16px;
  padding: 12px 20px;
  background: #fafafa;
  border-bottom: 1px solid #f1f3f4;
}

.sk-th {
  height: 12px;
  flex: 1;
}

.sk-table-row {
  display: flex;
  gap: 16px;
  padding: 14px 20px;
  border-bottom: 1px solid #f9fafb;
  align-items: center;
}

.sk-table-row:last-child {
  border-bottom: none;
}

.sk-td {
  height: 13px;
  flex: 1;
}
</style>
