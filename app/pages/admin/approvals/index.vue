<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading" :rows="5" :cols="7" />
    <template v-else>
      <!-- Header -->
      <div class="page-header">
        <div>
          <h2 class="page-title">คิวคำขออนุมัติ</h2>
          <p class="page-desc">คำขอจากครูและบุคลากรที่รอการพิจารณา</p>
        </div>
        <div class="header-actions">
          <span class="total-badge">รออนุมัติ {{ pendingCount }} รายการ</span>
        </div>
      </div>

      <!-- Summary strip -->
      <div class="summary-strip">
        <div v-for="s in summary" :key="s.label" class="summary-item">
          <span class="s-value" :style="s.color ? `color:${s.color}` : ''">
            {{ s.value }}
          </span>
          <span class="s-label">{{ s.label }}</span>
        </div>
      </div>

      <!-- Search + Filter tabs -->
      <div class="toolbar">
        <div class="search-wrap">
          <svg class="search-icon" width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="#9ca3af" stroke-width="1.4"/><path d="M10 10l3 3" stroke="#9ca3af" stroke-width="1.4" stroke-linecap="round"/></svg>
          <input
            v-model="search"
            class="input search"
            type="text"
            placeholder="ค้นหาชื่อหรือประเภทคำขอ..."
            autocomplete="off"
          />
        </div>
        <div class="tab-row">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            class="tab"
            :class="{ 'tab--active': activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
            <span v-if="tab.count > 0" class="tab-count">{{ tab.count }}</span>
          </button>
        </div>
      </div>

      <!-- Table -->
      <AdminDataTable :columns="cols" :rows="pagedRows">
        <template #cell-type="{ value }">
          <span class="type-cell">{{ value }}</span>
        </template>

        <template #cell-status="{ value }">
          <AdminStatusBadge
            :label="value as string"
            :variant="value === 'รออนุมัติ' ? 'pending' : value === 'อนุมัติแล้ว' ? 'approved' : 'rejected'"
          />
        </template>

        <template #rowActions="{ row }">
          <div class="action-btns">
            <button
              v-if="(row as ApprovalRow).status === 'รออนุมัติ'"
              type="button"
              class="btn-action btn-approve"
              @click="openApproveConfirm(row as ApprovalRow)"
            >
              อนุมัติ
            </button>
            <button
              v-if="(row as ApprovalRow).status === 'รออนุมัติ'"
              type="button"
              class="btn-action btn-reject"
              @click="openReject(row as ApprovalRow)"
            >
              ปฏิเสธ
            </button>
            <button
              type="button"
              class="btn-action btn-detail"
              @click="openDetail(row as ApprovalRow)"
            >
              รายละเอียด
            </button>
          </div>
        </template>
      </AdminDataTable>

      <!-- Pagination -->
      <div class="pagination">
        <span class="page-info">{{ (currentPage - 1) * pageSize + 1 }}–{{ Math.min(currentPage * pageSize, filteredRows.length) }} จาก {{ filteredRows.length }} รายการ</span>
        <div class="page-btns">
          <button class="page-btn" :disabled="currentPage === 1" @click="currentPage = 1">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 2L4 6l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 2L1 6l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7 2L3 6l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button
            v-for="p in pageNumbers"
            :key="p"
            class="page-btn"
            :class="{ 'page-btn--active': p === currentPage, 'page-btn--ellipsis': p === '...' }"
            :disabled="p === '...'"
            @click="typeof p === 'number' && (currentPage = p)"
          >
            {{ p }}
          </button>
          <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M5 2l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage = totalPages">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 2l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
        <select v-model="pageSize" class="input page-size-select">
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
        </select>
      </div>

      <!-- Approve confirm modal -->
      <AdminAppConfirmModal
        v-model="showApproveModal"
        title="ยืนยันการอนุมัติ?"
        :description="`ต้องการอนุมัติคำขอ '${approveTarget?.type}' ของ ${approveTarget?.requester} ใช่หรือไม่?`"
        confirm-label="ยืนยันอนุมัติ"
        @confirm="confirmApprove"
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
import { ref, computed, watch } from 'vue'
import { useApprovalsData, type ApprovalRow } from '~/composables/useApprovalsData'

definePageMeta({ layout: 'admin' })

const { loading } = usePageLoad()
const { rows: allRows } = useApprovalsData()

// ── Summary (computed from real data) ──
const pendingCount = computed(() => allRows.value.filter(r => r.status === 'รออนุมัติ').length)
const approvedCount = computed(() => allRows.value.filter(r => r.status === 'อนุมัติแล้ว').length)
const rejectedCount = computed(() => allRows.value.filter(r => r.status === 'ปฏิเสธ').length)

const summary = computed(() => [
  { value: pendingCount.value, label: 'รออนุมัติ', color: '#d97706' },
  { value: approvedCount.value, label: 'อนุมัติแล้ว', color: '#15803d' },
  { value: rejectedCount.value, label: 'ปฏิเสธ', color: '#b91c1c' },
  { value: allRows.value.length, label: 'ทั้งหมด', color: '' },
])

// ── Tabs (with counts) ──
const TAB_KEYS = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'แก้ไขข้อมูล', label: 'แก้ไขข้อมูล' },
  { key: 'เปิดรายวิชา', label: 'เปิดรายวิชา' },
  { key: 'เอกสาร', label: 'เอกสาร' },
  { key: 'ลงทะเบียน', label: 'ลงทะเบียน' },
]
const activeTab = ref('all')
const tabs = computed(() =>
  TAB_KEYS.map(t => ({
    ...t,
    count: t.key === 'all'
      ? 0
      : allRows.value.filter(r => r.type.includes(t.key) && r.status === 'รออนุมัติ').length,
  }))
)

const cols = [
  { key: 'id', label: '#' },
  { key: 'type', label: 'ประเภทคำขอ' },
  { key: 'requester', label: 'ผู้ยื่นคำขอ' },
  { key: 'role', label: 'บทบาท' },
  { key: 'detail', label: 'รายละเอียด' },
  { key: 'date', label: 'วันที่' },
  { key: 'status', label: 'สถานะ' },
]

const search = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

// reset page when filter/search changes
watch([search, activeTab], () => { currentPage.value = 1 })
watch(pageSize, () => { currentPage.value = 1 })

const filteredRows = computed(() => {
  let base = allRows.value
  if (activeTab.value !== 'all') {
    base = base.filter(r => r.type.includes(activeTab.value))
  }
  if (search.value) {
    const q = search.value.toLowerCase()
    base = base.filter(r =>
      r.type.toLowerCase().includes(q) ||
      r.requester.toLowerCase().includes(q) ||
      r.detail.toLowerCase().includes(q)
    )
  }
  return base
})

// ── Pagination ──
const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize.value)))

const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

const pageNumbers = computed(() => {
  const total = totalPages.value
  const cur = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | string)[] = [1]
  if (cur > 3) pages.push('...')
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i)
  if (cur < total - 2) pages.push('...')
  pages.push(total)
  return pages
})

function openDetail(row: ApprovalRow) {
  navigateTo(`/admin/approvals/${encodeURIComponent(String(row.id))}`)
}

// ── Quick approve ──
const showApproveModal = ref(false)
const approveTarget = ref<ApprovalRow | null>(null)

function openApproveConfirm(row: ApprovalRow) {
  approveTarget.value = row
  showApproveModal.value = true
}

function confirmApprove() {
  if (!approveTarget.value) return
  const idx = allRows.value.findIndex(r => r.id === approveTarget.value!.id)
  if (idx !== -1) allRows.value[idx] = { ...allRows.value[idx], status: 'อนุมัติแล้ว' }
  approveTarget.value = null
  showApproveModal.value = false
}

// ── Reject with reason ──
const showRejectModal = ref(false)
const rejectTarget = ref<ApprovalRow | null>(null)
const rejectNote = ref('')
const rejectNoteError = ref('')

function openReject(row: ApprovalRow) {
  rejectTarget.value = row
  rejectNote.value = ''
  rejectNoteError.value = ''
  showRejectModal.value = true
}

function confirmReject() {
  if (!rejectNote.value.trim()) { rejectNoteError.value = 'กรุณาระบุเหตุผล'; return }
  if (!rejectTarget.value) return
  const idx = allRows.value.findIndex(r => r.id === rejectTarget.value!.id)
  if (idx !== -1) allRows.value[idx] = { ...allRows.value[idx], status: 'ปฏิเสธ', note: rejectNote.value.trim() }
  showRejectModal.value = false
  rejectTarget.value = null
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 20px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.page-title { font-size: 1.2rem; font-weight: 700; margin: 0; color: #111827; }
.page-desc { color: #6b7280; margin-top: 4px; font-size: 0.88rem; }
.header-actions { display: flex; align-items: center; }
.total-badge { background: #fefce8; color: #92400e; border: 1px solid #fde68a; border-radius: 999px; padding: 4px 14px; font-size: 0.85rem; font-weight: 500; }

.summary-strip { display: flex; gap: 12px; flex-wrap: wrap; }
.summary-item { background: #fff; border: 1px solid #e8eaed; border-radius: 12px; padding: 14px 20px; display: flex; flex-direction: column; gap: 3px; min-width: 110px; }
.s-value { font-size: 1.5rem; font-weight: 700; line-height: 1.1; color: #111827; }
.s-label { font-size: 0.8rem; color: #6b7280; }

.toolbar { display: flex; flex-direction: column; gap: 10px; }
.search-wrap { position: relative; width: fit-content; }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); pointer-events: none; }
.input { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 12px; font-size: 0.875rem; font-family: inherit; background: #fff; color: #111827; outline: none; transition: border-color 0.12s; }
.input:focus { border-color: #6366f1; }
.search { width: 280px; padding-left: 32px; }

.tab-row { display: flex; gap: 4px; flex-wrap: wrap; }
.tab { display: inline-flex; align-items: center; gap: 6px; border: 1px solid #e5e7eb; border-radius: 9px; padding: 7px 14px; font-size: 0.86rem; background: #fff; color: #374151; cursor: pointer; font-family: inherit; transition: background 0.12s, border-color 0.12s; }
.tab:hover:not(.tab--active) { background: #f9fafb; }
.tab--active { background: #111827; color: #fff; border-color: #111827; }
.tab--active:hover { background: #1f2937; }
.tab-count { background: #ef4444; color: #fff; border-radius: 999px; font-size: 0.7rem; font-weight: 700; min-width: 18px; padding: 1px 5px; text-align: center; line-height: 1.4; }
.tab--active .tab-count { background: rgba(255,255,255,0.25); }

.type-cell { font-weight: 500; font-size: 0.88rem; }
.action-btns { display: flex; gap: 5px; justify-content: flex-end; }
.btn-action { border-radius: 7px; padding: 4px 9px; font-size: 0.78rem; border: 1px solid #d1d5db; background: #f9fafb; color: #374151; cursor: pointer; font-family: inherit; transition: background 0.1s; }
.btn-approve { border-color: #bbf7d0; background: #f0fdf4; color: #15803d; }
.btn-approve:hover { background: #dcfce7; }
.btn-reject { border-color: #fecaca; background: #fef2f2; color: #b91c1c; }
.btn-reject:hover { background: #fee2e2; }
.btn-detail { border-color: #e5e7eb; background: #fff; color: #374151; }
.btn-detail:hover { background: #f9fafb; }

.field { display: flex; flex-direction: column; gap: 5px; font-size: 0.83rem; font-weight: 500; color: #374151; }
.req { color: #ef4444; }
.field-error { font-size: 0.75rem; color: #ef4444; }
.form-textarea { min-height: 90px; resize: vertical; }

.pagination { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.page-info { font-size: 0.82rem; color: #6b7280; white-space: nowrap; margin-right: 4px; }
.page-btns { display: flex; gap: 3px; }
.page-btn { min-width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid #e5e7eb; border-radius: 7px; background: #fff; color: #374151; font-size: 0.82rem; font-weight: 500; font-family: inherit; cursor: pointer; padding: 0 6px; transition: all 0.1s; }
.page-btn:hover:not(:disabled) { background: #f3f4f6; border-color: #d1d5db; }
.page-btn:disabled { opacity: 0.35; cursor: default; }
.page-btn--active { background: #111827; color: #fff; border-color: #111827; }
.page-btn--ellipsis { border-color: transparent; background: transparent; cursor: default; }
.page-size-select { padding: 6px 10px; font-size: 0.82rem; cursor: pointer; height: 32px; }
</style>
