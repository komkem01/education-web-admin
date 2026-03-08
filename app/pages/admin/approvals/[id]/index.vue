<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading" :rows="4" :cols="2" />
    <template v-else>
      <div v-if="!record" class="not-found">
        <p class="not-found-text">ไม่พบข้อมูลคำขอ</p>
        <button class="btn btn-primary" @click="navigateTo('/admin/approvals')">← กลับรายการ</button>
      </div>

      <template v-else>
        <div class="page-header">
          <div class="header-left">
            <button class="btn btn-back" @click="navigateTo('/admin/approvals')">กลับ</button>
            <div>
              <h2 class="page-title">{{ requestTypeLabel }}</h2>
              <p class="page-desc">คำขอ #{{ record.id }} · {{ dateText }}</p>
            </div>
          </div>
          <div class="header-actions">
            <AdminStatusBadge :label="statusText" :variant="statusText === 'รออนุมัติ' ? 'pending' : statusText === 'อนุมัติแล้ว' ? 'approved' : 'rejected'" />
            <template v-if="statusText === 'รออนุมัติ'">
              <button class="btn btn-edit" @click="showApproveConfirm = true">อนุมัติ</button>
              <button class="btn btn-delete" @click="showRejectModal = true">ปฏิเสธ</button>
            </template>
          </div>
        </div>

        <div class="detail-card">
          <p class="section-title">รายละเอียดคำขอ</p>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label"># คำขอ</span>
              <span class="detail-value mono">{{ record.id }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">วันที่ยื่น</span>
              <span class="detail-value">{{ dateText }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">ผู้ยื่นคำขอ</span>
              <span class="detail-value">{{ record.requester_name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">บทบาท</span>
              <span class="detail-value">{{ roleLabel }}</span>
            </div>
            <div class="detail-item detail-item--full">
              <span class="detail-label">รายละเอียด</span>
              <span class="detail-value">{{ record.detail || '-' }}</span>
            </div>
            <div class="detail-item detail-item--full">
              <span class="detail-label">สถานะ</span>
              <span class="detail-value">
                <AdminStatusBadge :label="statusText" :variant="statusText === 'รออนุมัติ' ? 'pending' : statusText === 'อนุมัติแล้ว' ? 'approved' : 'rejected'" />
              </span>
            </div>
            <div v-if="record.comment" class="detail-item detail-item--full">
              <span class="detail-label">หมายเหตุผู้อนุมัติ</span>
              <span class="detail-value note-value">{{ record.comment }}</span>
            </div>
          </div>
        </div>

        <div v-if="statusText === 'รออนุมัติ'" class="action-strip">
          <p class="action-strip-hint">คำขอนี้ยังรอการพิจารณา</p>
          <div class="action-strip-btns">
            <button class="btn btn-edit" @click="showApproveConfirm = true">อนุมัติคำขอนี้</button>
            <button class="btn btn-delete" @click="showRejectModal = true">ปฏิเสธคำขอนี้</button>
          </div>
        </div>

        <div v-else class="done-banner" :class="statusText === 'อนุมัติแล้ว' ? 'done-banner--approved' : 'done-banner--rejected'">
          <span class="done-icon">{{ statusText === 'อนุมัติแล้ว' ? '✓' : '✕' }}</span>
          <span>คำขอนี้ถูก<strong>{{ statusText }}</strong>แล้ว</span>
        </div>
      </template>

      <AdminAppConfirmModal
        v-model="showApproveConfirm"
        title="ยืนยันการอนุมัติ?"
        :description="`ต้องการอนุมัติคำขอของ ${record?.requester_name || '-'} ใช่หรือไม่?`"
        confirm-label="ยืนยันอนุมัติ"
        @confirm="approveRecord"
      />

      <AdminAppModal
        v-model="showRejectModal"
        title="ระบุเหตุผลการปฏิเสธ"
        size="sm"
        confirm-label="ยืนยันปฏิเสธ"
        @confirm="confirmReject"
      >
        <div class="field">
          <span>เหตุผล / หมายเหตุ <span class="req">*</span></span>
          <textarea v-model="rejectNote" class="input form-textarea" placeholder="ระบุเหตุผลสำหรับผู้ยื่นคำขอ..." />
          <span v-if="rejectNoteError" class="field-error">{{ rejectNoteError }}</span>
        </div>
      </AdminAppModal>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

definePageMeta({ layout: 'admin' })

type BaseResponse<T> = { data: T }

type ReportsApprovalApiItem = {
  id: string
  type: string
  requester_name: string
  requester_role: string
  title: string
  detail: string
  status: 'pending' | 'approved' | 'rejected'
  comment: string | null
  created_at: string
}

const { loading } = usePageLoad()
const route = useRoute()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('edu_auth_token')

const requestId = String(route.params.id ?? '')
const requestType = String(route.query.type ?? '')

const record = ref<ReportsApprovalApiItem | null>(null)

function authHeaders() {
  return { Authorization: `Bearer ${authToken.value}` }
}

async function apiFetch<T>(path: string, options?: Parameters<typeof $fetch<T>>[1]) {
  try {
    return await $fetch<T>(`${config.public.apiBase}/back-office${path}`, options)
  }
  catch {
    return await $fetch<T>(`${config.public.apiBase}${path}`, options)
  }
}

const dateText = computed(() => {
  if (!record.value) return '-'
  const dt = new Date(record.value.created_at)
  if (Number.isNaN(dt.getTime())) return '-'
  return dt.toLocaleDateString('th-TH')
})

const requestTypeLabel = computed(() => {
  if (!record.value) return '-'
  return record.value.title || record.value.type
})

const roleLabel = computed(() => {
  const map: Record<string, string> = {
    admin: 'แอดมิน',
    staff: 'บุคลากร',
    teacher: 'ครู',
    student: 'นักเรียน',
    parent: 'ผู้ปกครอง',
  }
  if (!record.value) return '-'
  return map[record.value.requester_role] || record.value.requester_role
})

const statusText = computed(() => {
  if (!record.value) return 'รออนุมัติ'
  if (record.value.status === 'approved') return 'อนุมัติแล้ว'
  if (record.value.status === 'rejected') return 'ปฏิเสธ'
  return 'รออนุมัติ'
})

async function load() {
  if (!import.meta.client || !authToken.value || !requestId || !requestType) return
  try {
    const res = await apiFetch<BaseResponse<ReportsApprovalApiItem>>(
      `/reports/approvals/${encodeURIComponent(requestType)}/${encodeURIComponent(requestId)}`,
      { headers: authHeaders() },
    )
    record.value = res.data || null
  }
  catch {
    record.value = null
  }
}

if (import.meta.client) {
  load()
}

async function patchRecord(status: 'approved' | 'rejected', comment: string | null) {
  if (!record.value) return
  await apiFetch(`/reports/approvals/${encodeURIComponent(record.value.type)}/${encodeURIComponent(record.value.id)}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: {
      status,
      comment,
    },
  })
  await load()
}

const showApproveConfirm = ref(false)
async function approveRecord() {
  await patchRecord('approved', null)
  showApproveConfirm.value = false
}

const showRejectModal = ref(false)
const rejectNote = ref('')
const rejectNoteError = ref('')

async function confirmReject() {
  if (!rejectNote.value.trim()) {
    rejectNoteError.value = 'กรุณาระบุเหตุผล'
    return
  }
  await patchRecord('rejected', rejectNote.value.trim())
  showRejectModal.value = false
  rejectNote.value = ''
  rejectNoteError.value = ''
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 22px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.header-left { display: flex; align-items: flex-start; gap: 12px; }
.header-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.page-title { font-size: 1.2rem; font-weight: 700; margin: 0; color: #111827; }
.page-desc { color: #6b7280; margin-top: 4px; font-size: 0.85rem; }
.btn { display: inline-flex; align-items: center; gap: 5px; border-radius: 8px; padding: 8px 14px; font-size: 0.875rem; font-weight: 500; border: 1px solid #d1d5db; background: #fff; color: #374151; cursor: pointer; font-family: inherit; transition: background 0.12s; }
.btn:hover { background: #f9fafb; }
.btn-back { color: #6b7280; padding: 7px 12px; font-size: 0.82rem; margin-top: 2px; }
.btn-primary { background: #111827; color: #fff; border-color: #111827; }
.btn-edit { border-color: #bfdbfe; background: #eff6ff; color: #1d4ed8; }
.btn-edit:hover { background: #dbeafe; }
.btn-delete { border-color: #fecaca; background: #fff5f5; color: #dc2626; }
.btn-delete:hover { background: #fee2e2; }
.detail-card { background: #fff; border: 1px solid #e8eaed; border-radius: 14px; padding: 24px; }
.section-title { font-size: 0.78rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 18px; padding-bottom: 10px; border-bottom: 1px solid #f3f4f6; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px 32px; }
.detail-item { display: flex; flex-direction: column; gap: 5px; }
.detail-item--full { grid-column: 1 / -1; }
.detail-label { font-size: 0.72rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
.detail-value { font-size: 0.95rem; color: #111827; font-weight: 500; }
.detail-value.mono { font-family: monospace; letter-spacing: 0.04em; }
.note-value { color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 8px 12px; font-size: 0.875rem; }
.json-box { margin: 0; background: #0f172a; color: #e2e8f0; border-radius: 8px; padding: 10px; font-size: 0.78rem; overflow: auto; }
.action-strip { background: #fff; border: 1px solid #e8eaed; border-radius: 14px; padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
.action-strip-hint { margin: 0; font-size: 0.88rem; color: #6b7280; }
.action-strip-btns { display: flex; gap: 12px; flex-wrap: wrap; }
.done-banner { display: flex; align-items: center; gap: 12px; padding: 16px 22px; border-radius: 12px; font-size: 0.9rem; font-weight: 500; }
.done-banner--approved { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; }
.done-banner--rejected { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; }
.done-icon { font-size: 1.1rem; font-weight: 700; }
.not-found { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 60px 0; color: #9ca3af; }
.not-found-text { font-size: 1rem; }
.field { display: flex; flex-direction: column; gap: 5px; font-size: 0.83rem; font-weight: 500; color: #374151; }
.req { color: #ef4444; }
.field-error { font-size: 0.75rem; color: #ef4444; }
.input { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 12px; font-size: 0.875rem; font-family: inherit; background: #fff; color: #111827; outline: none; transition: border-color 0.12s; }
.input:focus { border-color: #6366f1; }
.form-textarea { min-height: 90px; resize: vertical; }
</style>