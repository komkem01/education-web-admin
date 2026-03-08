<template>
	<div class="page">
		<h2 class="page-title">รายละเอียดข้อมูลโรงเรียน</h2>
		<p class="page-desc" v-if="pending">กำลังโหลดข้อมูล...</p>
		<p class="page-error" v-else-if="errorMessage">{{ errorMessage }}</p>

		<div v-else class="detail-card">
			<div class="detail-row">
				<span class="label">ชื่อโรงเรียน</span>
				<span class="value">{{ school?.name || '-' }}</span>
			</div>
			<div class="detail-row">
				<span class="label">ที่อยู่</span>
				<span class="value">{{ school?.address || '-' }}</span>
			</div>
			<div class="detail-row">
				<span class="label">คำอธิบาย</span>
				<span class="value">{{ school?.description || '-' }}</span>
			</div>
			<div class="detail-row">
				<span class="label">สีธีม</span>
				<span class="value">{{ school?.theme_color || '-' }}</span>
			</div>
			<div class="detail-row">
				<span class="label">โลโก้</span>
				<a v-if="school?.logo_url" class="value" :href="school.logo_url" target="_blank" rel="noopener noreferrer">{{ school.logo_url }}</a>
				<span v-else class="value">-</span>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const route = useRoute()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('edu_auth_token')
const id = computed(() => String(route.params.id ?? ''))

type SchoolModel = {
	id: string
	name: string
	address: string
	description: string | null
	logo_url: string | null
	theme_color: string | null
}

type SchoolResponse = {
	data: SchoolModel
}

const school = ref<SchoolModel | null>(null)
const pending = ref(false)
const errorMessage = ref('')

async function loadSchoolDetail() {
	if (!import.meta.client || !id.value || !authToken.value) return

	pending.value = true
	errorMessage.value = ''

	try {
		const res = await $fetch<SchoolResponse>(`${config.public.apiBase}/back-office/schools/${id.value}`, {
			headers: { Authorization: `Bearer ${authToken.value}` },
		})
		school.value = res.data
	}
	catch {
		try {
			const res = await $fetch<SchoolResponse>(`${config.public.apiBase}/schools/${id.value}`, {
				headers: { Authorization: `Bearer ${authToken.value}` },
			})
			school.value = res.data
		}
		catch {
			errorMessage.value = 'ไม่สามารถโหลดรายละเอียดโรงเรียนได้'
		}
	}
	finally {
		pending.value = false
	}
}

watch(id, () => {
	loadSchoolDetail()
}, { immediate: true })
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 8px; }
.page-title { margin: 0; font-size: 1.1rem; font-weight: 700; color: #111827; }
.page-desc { margin: 0; color: #6b7280; font-size: 0.9rem; }
.page-error { margin: 0; color: #dc2626; font-size: 0.9rem; }
.detail-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; background: #fff; display: grid; gap: 8px; }
.detail-row { display: grid; gap: 2px; }
.label { font-size: 0.75rem; color: #6b7280; }
.value { color: #111827; font-size: 0.95rem; word-break: break-word; }
</style>
