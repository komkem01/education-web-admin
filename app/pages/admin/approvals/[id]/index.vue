<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading" :rows="4" :cols="2" />
    <template v-else>
      <div v-if="!record" class="not-found">
        <p class="not-found-text">ไม่พบข้อมูลคำขอ</p>
        <button class="btn btn-primary" @click="navigateTo('/admin/approvals')">← กลับรายการ</button>
      </div>

      <template v-else>
        <!-- Header -->
        <div class="page-header">
          <div class="header-left">
            <button class="btn btn-back" @click="navigateTo('/admin/approvals')">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7 2L3 6l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              กลับ
            </button>
            <div>
              <h2 class="page-title">{{ record.type }}</h2>
              <p class="page-desc">คำขอ #{{ record.id }} · {{ record.date }}</p>
            </div>
          </div>
          <div class="header-actions">
            <AdminStatusBadge
              :label="record.status"
              :variant="record.status === 'รออนุมัติ' ? 'pending' : record.status === 'อนุมัติแล้ว' ? 'approved' : 'rejected'"
            />
            <template v-if="record.status === 'รออนุมัติ'">
              <button class="btn btn-approve" @click="showApproveConfirm = true">✓ อนุมัติ</button>
              <button class="btn btn-reject" @click="showRejectModal = true">✕ ปฏิเสธ</button>
            </template>
          </div>
        </div>

        <!-- Detail card -->
        <div class="detail-card">
          <p class="section-title">รายละเอียดคำขอ</p>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label"># คำขอ</span>
              <span class="detail-value mono">{{ record.id }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">วันที่ยื่น</span>
              <span class="detail-value">{{ record.date }}</span>
            </div>
            <div class="detail-item detail-item--full">
              <span class="detail-label">ประเภทคำขอ</span>
              <span class="detail-value">{{ record.type }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">ผู้ยื่นคำขอ</span>
              <span class="detail-value">{{ record.requester }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">บทบาท</span>
              <span class="detail-value">{{ record.role }}</span>
            </div>
            <div class="detail-item detail-item--full">
              <span class="detail-label">รายละเอียด</span>
              <span class="detail-value">{{ record.detail }}</span>
            </div>
            <div class="detail-item detail-item--full">
              <span class="detail-label">สถานะ</span>
              <span class="detail-value">
                <AdminStatusBadge
                  :label="record.status"
                  :variant="record.status === 'รออนุมัติ' ? 'pending' : record.status === 'อนุมัติแล้ว' ? 'approved' : 'rejected'"
                />
              </span>
            </div>
            <div v-if="record.note" class="detail-item detail-item--full">
              <span class="detail-label">เหตุผลการปฏิเสธ</span>
              <span class="detail-value note-value">{{ record.note }}</span>
            </div>
          </div>
        </div>

        <!-- Action strip (pending only) -->
        <div v-if="record.status === 'รออนุมัติ'" class="action-strip">
          <p class="action-strip-hint">คำขอนี้ยังรอการพิจารณา — กรุณาดำเนินการ</p>
          <div class="action-strip-btns">
            <button class="btn btn-approve btn-lg" @click="showApproveConfirm = true">✓ อนุมัติคำขอนี้</button>
            <button class="btn btn-reject btn-lg" @click="showRejectModal = true">✕ ปฏิเสธคำขอนี้</button>
          </div>
        </div>

        <!-- Done banner -->
        <div v-else class="done-banner" :class="record.status === 'อนุมัติแล้ว' ? 'done-banner--approved' : 'done-banner--rejected'">
          <span class="done-icon">{{ record.status === 'อนุมัติแล้ว' ? '✓' : '✕' }}</span>
          <span>คำขอนี้ถูก<strong>{{ record.status }}</strong>แล้ว</span>
        </div>
      </template>

      <!-- Approve confirm modal -->
      <AdminAppConfirmModal
        v-model="showApproveConfirm"
        title="ยืนยันการอนุมัติ?"
        :description="`ต้องการอนุมัติคำขอ '${record?.type}' ของ ${record?.requester} ใช่หรือไม่?`"
        confirm-label="ยืนยันอนุมัติ"
        @confirm="approveRecord"
      />

      <!-- Reject reason modal -->
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
import { ref, computed } from 'vue'
import { useApprovalsData } from '~/composables/useApprovalsData'

definePageMeta({ layout: 'admin' })

const { loading } = usePageLoad()
const route = useRoute()
const { rows } = useApprovalsData()

const id = computed(() => decodeURIComponent(String(route.params.id ?? '')))
const record = computed(() => rows.value.find(r => String(r.id) === id.value) ?? null)

const showApproveConfirm = ref(false)

function approveRecord() {
  if (!record.value) return
  const idx = rows.value.findIndex(r => r.id === record.value!.id)
  if (idx !== -1) rows.value[idx] = { ...rows.value[idx], status: 'อนุมัติแล้ว', note: undefined }
}

// ── Reject with reason ──
const showRejectModal = ref(false)
const rejectNote = ref('')
const rejectNoteError = ref('')

function confirmReject() {
  if (!rejectNote.value.trim()) { rejectNoteError.value = 'กรุณาระบุเหตุผล'; return }
  if (!record.value) return
  const idx = rows.value.findIndex(r => r.id === record.value!.id)
  if (idx !== -1) rows.value[idx] = { ...rows.value[idx], status: 'ปฏิเสธ', note: rejectNote.value.trim() }
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
.btn-approve { border-color: #bbf7d0; background: #f0fdf4; color: #15803d; }
.btn-approve:hover { background: #dcfce7; }
.btn-reject { border-color: #fecaca; background: #fef2f2; color: #b91c1c; }
.btn-reject:hover { background: #fee2e2; }
.btn-lg { padding: 10px 20px; font-size: 0.9rem; }
.detail-card { background: #fff; border: 1px solid #e8eaed; border-radius: 14px; padding: 24px; }
.section-title { font-size: 0.78rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 18px; padding-bottom: 10px; border-bottom: 1px solid #f3f4f6; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px 32px; }
.detail-item { display: flex; flex-direction: column; gap: 5px; }
.detail-item--full { grid-column: 1 / -1; }
.detail-label { font-size: 0.72rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
.detail-value { font-size: 0.95rem; color: #111827; font-weight: 500; }
.detail-value.mono { font-family: monospace; letter-spacing: 0.04em; }
.note-value { color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 8px 12px; font-size: 0.875rem; }
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
