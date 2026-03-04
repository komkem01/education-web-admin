<template>
	<div class="page">
		<h2 class="page-title">รายละเอียดสิทธิ์และบทบาท</h2>
		<p class="page-desc">รหัส: {{ id }}</p>
	</div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const route = useRoute()
const id = computed(() => String(route.params.id ?? '-'))
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 8px; }
.page-title { margin: 0; font-size: 1.1rem; font-weight: 700; color: #111827; }
.page-desc { margin: 0; color: #6b7280; font-size: 0.9rem; }
</style>
