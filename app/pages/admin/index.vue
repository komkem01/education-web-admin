<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading" :show-cards="true" :rows="4" :cols="5" />
    <template v-else>
    <div class="page-header">
      <div>
        <h2 class="page-title">ยินดีต้อนรับ {{ headerIdentity }}</h2>
        <p class="page-desc">ภาพรวมระบบ — โรงเรียนตัวอย่างวิทยา · ปีการศึกษา 2568</p>
      </div>
    </div>

    <!-- ── Metric Cards ── -->
    <div class="grid-4 section-gap">
      <AdminMetricCard icon="👥" label="บุคลากรทั้งหมด" :value="String(personnelRows.length)" :sub="`อยู่ในระบบ ${activePersonnelCount} คน`" accent="#6366f1" />
      <AdminMetricCard icon="🎓" label="ครูทั้งหมด" :value="String(summary.teachers_total)" :sub="`สอนอยู่ ${summary.teachers_active} คน`" accent="#0ea5e9" />
      <AdminMetricCard icon="📚" label="นักเรียนทั้งหมด" :value="summary.students_total.toLocaleString()" :sub="`ลงทะเบียนแล้ว ${summary.students_active} คน`" accent="#10b981" />
      <AdminMetricCard icon="✅" label="คำขอรออนุมัติ" :value="String(pendingCount)" :sub="`ทั้งหมด ${allApprovalCount} รายการ`" accent="#f59e0b" />
    </div>

    <!-- ── Quick Stats ── -->
    <div class="grid-3 section-gap">
      <div class="stat-card">
        <div class="stat-label">งานวิชาการ</div>
        <div class="stat-row"><span>รายวิชาที่เปิดสอน</span><strong>{{ summary.courses_total }}</strong></div>
        <div class="stat-row"><span>นักเรียนติด 0/ร/มส</span><strong>{{ failGradeCount }}</strong></div>
        <div class="stat-row"><span>เอกสาร ปพ. ค้างออก</span><strong>{{ summary.document_pending_total }}</strong></div>
        <NuxtLink to="/admin/school" class="stat-link">ไปหน้าวิชาการ →</NuxtLink>
      </div>

      <div class="stat-card">
        <div class="stat-label">งานทะเบียน</div>
        <div class="stat-row"><span>ย้ายเข้าเทอมนี้</span><strong title="นับจาก student_enrollments.status = active (ภายใต้ปี/เทอมที่เลือก)">{{ summary.transfer_in_total }}</strong></div>
        <div class="stat-row"><span>ย้ายออกเทอมนี้</span><strong title="นับจาก student_enrollments.status = dropped (ภายใต้ปี/เทอมที่เลือก)">{{ summary.transfer_out_total }}</strong></div>
        <div class="stat-row"><span>รอเลื่อนชั้นปี</span><strong title="นับจาก student_enrollments.status = incomplete (ภายใต้ปี/เทอมที่เลือก)">{{ summary.promotion_pending_total }}</strong></div>
        <!-- <p class="stat-hint">นิยามข้อมูล: active = ย้ายเข้า, dropped = ย้ายออก, incomplete = รอเลื่อนชั้นปี</p> -->
        <NuxtLink to="/admin/students" class="stat-link">ไปหน้านักเรียน →</NuxtLink>
      </div>

      <div class="stat-card">
        <div class="stat-label">งานปกครอง</div>
        <div class="stat-row"><span>นักเรียนถูกตัดคะแนน</span><strong>{{ lowDisciplineCount }}</strong></div>
        <div class="stat-row"><span>แจ้งเตือนผู้ปกครองวันนี้</span><strong>{{ summary.parent_notifications_today }}</strong></div>
        <div class="stat-row"><span>รอดำเนินการ</span><strong>{{ pendingCount }}</strong></div>
        <NuxtLink to="/admin/approvals" class="stat-link">ไปหน้าอนุมัติ →</NuxtLink>
      </div>
    </div>

    <!-- ── Approval Queue short ── -->
    <AdminDataTable title="คำขอล่าสุดรออนุมัติ" :columns="approvalCols" :rows="approvalRows">
      <template #actions>
        <NuxtLink to="/admin/approvals" class="btn btn-ghost">ดูทั้งหมด →</NuxtLink>
      </template>

      <template #cell-status="{ value }">
        <AdminStatusBadge
          :label="value as string"
          :variant="value === 'อนุมัติแล้ว' ? 'approved' : value === 'ปฏิเสธ' ? 'default' : 'pending'"
        />
      </template>

      <template #rowActions="{ row }">
        <div class="action-btns">
          <button
            type="button"
            class="btn btn-detail"
            @click="openDetail(row as unknown as ApprovalRow)"
          >รายละเอียด</button>
          <button
            v-if="(row as unknown as ApprovalRow).status === 'รออนุมัติ'"
            type="button"
            class="btn btn-approve"
            @click="openApprove(row as unknown as ApprovalRow)"
          >อนุมัติ</button>
          <button
            v-if="(row as unknown as ApprovalRow).status === 'รออนุมัติ'"
            type="button"
            class="btn btn-reject"
            @click="openReject(row as unknown as ApprovalRow)"
          >ปฏิเสธ</button>
          <span v-if="(row as unknown as ApprovalRow).status !== 'รออนุมัติ'" class="done-label">ดำเนินการแล้ว</span>
        </div>
      </template>
    </AdminDataTable>

    <!-- Detail modal -->
    <AdminAppModal
      v-model="showDetailModal"
      title="รายละเอียดคำขอ"
      size="sm"
    >
      <template #footer>
        <button type="button" class="btn btn-ghost-sm" @click="showDetailModal = false">ปิด</button>
        <button
          v-if="detailRow?.status === 'รออนุมัติ'"
          type="button"
          class="btn btn-approve-confirm"
          @click="showDetailModal = false; openApprove(detailRow!)"
        >อนุมัติ</button>
        <button
          v-if="detailRow?.status === 'รออนุมัติ'"
          type="button"
          class="btn btn-reject-confirm"
          @click="showDetailModal = false; openReject(detailRow!)"
        >ปฏิเสธ</button>
      </template>
      <div class="detail-body">
        <div class="detail-row">
          <span class="detail-label">ประเภทคำขอ</span>
          <span class="detail-value">{{ detailRow?.type }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">ผู้ส่งคำขอ</span>
          <span class="detail-value">{{ detailRow?.requester }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">บทบาท</span>
          <span class="detail-value">{{ detailRow?.role }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">วันที่ส่ง</span>
          <span class="detail-value">{{ detailRow?.date }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">สถานะ</span>
          <AdminStatusBadge
            :label="detailRow?.status ?? ''"
            :variant="detailRow?.status === 'อนุมัติแล้ว' ? 'approved' : detailRow?.status === 'ปฏิเสธ' ? 'default' : 'pending'"
          />
        </div>
        <div class="detail-divider" />
        <div class="detail-desc-label">รายละเอียดเพิ่มเติม</div>
        <p class="detail-desc">{{ detailRow?.detail }}</p>
      </div>
    </AdminAppModal>

    <!-- Approve confirm -->
    <AdminAppModal
      v-model="showApproveModal"
      title="ยืนยันการอนุมัติ"
      size="sm"
      confirm-label="อนุมัติ"
      @confirm="confirmApprove"
    >
      <div class="confirm-body">
        <div class="confirm-icon confirm-icon--approve">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="12" stroke="#16a34a" stroke-width="1.6" fill="#f0fdf4"/>
            <path d="M9 14l3.5 3.5L19 10" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <p class="confirm-text">ต้องการ <strong>อนุมัติ</strong> คำขอนี้ใช่หรือไม่?</p>
        <p class="confirm-sub">{{ pendingRow?.type }} — {{ pendingRow?.requester }}</p>
      </div>
      <template #footer>
        <button type="button" class="btn btn-ghost-sm" @click="showApproveModal = false">ยกเลิก</button>
        <button type="button" class="btn btn-approve-confirm" @click="confirmApprove">ยืนยันอนุมัติ</button>
      </template>
    </AdminAppModal>

    <!-- Reject confirm -->
    <AdminAppModal
      v-model="showRejectModal"
      title="ยืนยันการปฏิเสธ"
      size="sm"
      @confirm="confirmReject"
    >
      <div class="confirm-body">
        <div class="confirm-icon confirm-icon--reject">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="12" stroke="#dc2626" stroke-width="1.6" fill="#fef2f2"/>
            <path d="M10 10l8 8M18 10l-8 8" stroke="#dc2626" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <p class="confirm-text">ต้องการ <strong>ปฏิเสธ</strong> คำขอนี้ใช่หรือไม่?</p>
        <p class="confirm-sub">{{ pendingRow?.type }} — {{ pendingRow?.requester }}</p>
      </div>
      <template #footer>
        <button type="button" class="btn btn-ghost-sm" @click="showRejectModal = false">ยกเลิก</button>
        <button type="button" class="btn btn-reject-confirm" @click="confirmReject">ยืนยันปฏิเสธ</button>
      </template>
    </AdminAppModal>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

definePageMeta({ layout: 'admin' })

type BaseResponse<T> = { data: T }

type SummaryData = {
  teachers_total: number
  teachers_active: number
  students_total: number
  students_active: number
  transfer_in_total: number
  transfer_out_total: number
  promotion_pending_total: number
  subjects_total: number
  courses_total: number
  grade_records_total: number
  grade_pass_total: number
  grade_fail_total: number
  attendance_total: number
  attendance_present: number
  attendance_absent: number
  behavior_total: number
  behavior_good: number
  behavior_bad: number
  document_pending_total: number
  parent_notifications_today: number
}

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

type RoleMemberApiItem = {
  id: string
  email: string
  active_role: string
  name: string
  roles: string[]
}

type ApprovalRow = {
  id: string
  typeKey: string
  requester: string
  role: string
  type: string
  detail: string
  date: string
  createdAt: string
  status: 'รออนุมัติ' | 'อนุมัติแล้ว' | 'ปฏิเสธ'
}

const { loading } = usePageLoad()
const { displayName, displayRole } = useAdminAuth()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('edu_auth_token')

const summary = ref<SummaryData>({
  teachers_total: 0,
  teachers_active: 0,
  students_total: 0,
  students_active: 0,
  transfer_in_total: 0,
  transfer_out_total: 0,
  promotion_pending_total: 0,
  subjects_total: 0,
  courses_total: 0,
  grade_records_total: 0,
  grade_pass_total: 0,
  grade_fail_total: 0,
  attendance_total: 0,
  attendance_present: 0,
  attendance_absent: 0,
  behavior_total: 0,
  behavior_good: 0,
  behavior_bad: 0,
  document_pending_total: 0,
  parent_notifications_today: 0,
})
const approvals = ref<ApprovalRow[]>([])
const roleMembers = ref<RoleMemberApiItem[]>([])

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

function toThaiStatus(status: string): ApprovalRow['status'] {
  if (status === 'approved') return 'อนุมัติแล้ว'
  if (status === 'rejected') return 'ปฏิเสธ'
  return 'รออนุมัติ'
}

function toThaiRole(role: string) {
  const map: Record<string, string> = {
    admin: 'แอดมิน',
    staff: 'บุคลากร',
    teacher: 'ครู',
    student: 'นักเรียน',
    parent: 'ผู้ปกครอง',
  }
  return map[role] || role
}

function toDateText(value: string) {
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return '-'
  return dt.toLocaleDateString('th-TH')
}

async function loadDashboard() {
  if (!import.meta.client || !authToken.value) return
  try {
    const [summaryRes, approvalsRes, rolesRes] = await Promise.all([
      apiFetch<BaseResponse<{ summary: SummaryData }>>('/reports/summary', { headers: authHeaders() }),
      apiFetch<BaseResponse<{ items: ReportsApprovalApiItem[] }>>('/reports/approvals', { headers: authHeaders() }),
      apiFetch<BaseResponse<{ items: RoleMemberApiItem[] }>>('/reports/roles-members', { headers: authHeaders() }),
    ])

    summary.value = summaryRes.data?.summary || summary.value
    roleMembers.value = rolesRes.data?.items || []
    approvals.value = (approvalsRes.data?.items || []).map(item => ({
      id: item.id,
      typeKey: item.type,
      requester: item.requester_name,
      role: toThaiRole(item.requester_role),
      type: item.title,
      detail: item.detail,
      date: toDateText(item.created_at),
      createdAt: item.created_at,
      status: toThaiStatus(item.status),
    })).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  }
  catch {
    summary.value = {
      teachers_total: 0,
      teachers_active: 0,
      students_total: 0,
      students_active: 0,
      transfer_in_total: 0,
      transfer_out_total: 0,
      promotion_pending_total: 0,
      subjects_total: 0,
      courses_total: 0,
      grade_records_total: 0,
      grade_pass_total: 0,
      grade_fail_total: 0,
      attendance_total: 0,
      attendance_present: 0,
      attendance_absent: 0,
      behavior_total: 0,
      behavior_good: 0,
      behavior_bad: 0,
      document_pending_total: 0,
      parent_notifications_today: 0,
    }
    approvals.value = []
    roleMembers.value = []
  }
}

if (import.meta.client) {
  loadDashboard()
}

const headerIdentity = computed(() => {
  if (!displayName.value) return displayRole.value
  return `${displayRole.value} · ${displayName.value}`
})

const personnelRows = computed(() =>
  roleMembers.value.filter(member => member.roles.includes('admin') || member.roles.includes('staff')),
)

// ── Metric cards ──
const activePersonnelCount = computed(() => personnelRows.value.length)
const pendingCount = computed(() => approvals.value.filter(r => r.status === 'รออนุมัติ').length)
const allApprovalCount = computed(() => approvals.value.length)

// ── Quick stats ──
const failGradeCount = computed(() => summary.value.grade_fail_total)
const lowDisciplineCount = computed(() => summary.value.behavior_bad)
const approvalRows = computed(() => approvals.value.filter(item => item.status === 'รออนุมัติ').slice(0, 5))

const approvalCols = [
  { key: 'type', label: 'ประเภทคำขอ' },
  { key: 'requester', label: 'ผู้ส่งคำขอ' },
  { key: 'role', label: 'บทบาท' },
  { key: 'date', label: 'วันที่' },
  { key: 'status', label: 'สถานะ' },
]

const showApproveModal = ref(false)
const showRejectModal = ref(false)
const showDetailModal = ref(false)
const pendingRow = ref<ApprovalRow | null>(null)
const detailRow = ref<ApprovalRow | null>(null)

function openDetail(row: ApprovalRow) {
  detailRow.value = row
  showDetailModal.value = true
}

function openApprove(row: ApprovalRow) {
  pendingRow.value = row
  showApproveModal.value = true
}

function openReject(row: ApprovalRow) {
  pendingRow.value = row
  showRejectModal.value = true
}

async function patchApproval(row: ApprovalRow, status: 'approved' | 'rejected') {
  await apiFetch(`/reports/approvals/${encodeURIComponent(row.typeKey)}/${encodeURIComponent(row.id)}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: { status },
  })
}

async function confirmApprove() {
  if (pendingRow.value) {
    await patchApproval(pendingRow.value, 'approved')
    await loadDashboard()
  }
  showApproveModal.value = false
  pendingRow.value = null
}

async function confirmReject() {
  if (pendingRow.value) {
    await patchApproval(pendingRow.value, 'rejected')
    await loadDashboard()
  }
  showRejectModal.value = false
  pendingRow.value = null
}
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0;
  color: #111827;
}

.page-desc {
  color: #6b7280;
  margin-top: 4px;
  font-size: 0.85rem;
}

.api-session {
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  border-radius: 10px;
  padding: 10px 12px;
}

.api-session-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: #4338ca;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.api-session-text {
  margin: 0;
  font-size: 0.82rem;
  color: #312e81;
}

.api-session-error {
  color: #b91c1c;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.section-gap {
  margin: 0;
}

.grid-4 {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.stat-card {
  background: #ffffff;
  border: 1px solid #f1f3f4;
  border-radius: 12px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,.03);
}

.stat-label {
  font-weight: 600;
  font-size: 0.88rem;
  color: #111827;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #6b7280;
}

.stat-row strong {
  font-weight: 600;
  color: #111827;
}

.stat-hint {
  margin: -2px 0 0;
  font-size: 0.75rem;
  color: #9ca3af;
  line-height: 1.45;
}

.stat-link {
  font-size: 0.8rem;
  color: #6366f1;
  margin-top: 4px;
  font-weight: 500;
}

.stat-link:hover {
  color: #4f46e5;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #111827;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.12s;
}

.btn-primary {
  background: #111827;
  color: #ffffff;
  border-color: #111827;
}

.btn-primary:hover { background: #1f2937; }

.btn-ghost {
  border: none;
  background: none;
  color: #6366f1;
  padding: 0;
  font-size: 0.875rem;
  font-weight: 500;
}

.action-btns {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
  align-items: center;
  flex-wrap: nowrap;
}

.done-label {
  font-size: 0.78rem;
  color: #9ca3af;
  font-style: italic;
}

/* Confirm modal body */
.confirm-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 8px 0 4px;
  text-align: center;
}

.confirm-icon {
  margin-bottom: 2px;
}

.confirm-text {
  font-size: 0.95rem;
  color: #111827;
  margin: 0;
}

.confirm-sub {
  font-size: 0.82rem;
  color: #6b7280;
  margin: 0;
}

.btn-ghost-sm {
  display: inline-flex;
  align-items: center;
  border-radius: 8px;
  padding: 7px 14px;
  font-size: 0.85rem;
  font-weight: 500;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.12s;
}

.btn-ghost-sm:hover { background: #f9fafb; }

.btn-approve-confirm {
  display: inline-flex;
  align-items: center;
  border-radius: 8px;
  padding: 7px 14px;
  font-size: 0.85rem;
  font-weight: 500;
  border: 1px solid #bbf7d0;
  background: #16a34a;
  color: #fff;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.12s;
}

.btn-approve-confirm:hover { background: #15803d; }

.btn-reject-confirm {
  display: inline-flex;
  align-items: center;
  border-radius: 8px;
  padding: 7px 14px;
  font-size: 0.85rem;
  font-weight: 500;
  border: 1px solid #fecaca;
  background: #dc2626;
  color: #fff;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.12s;
}

.btn-reject-confirm:hover { background: #b91c1c; }

.btn-detail {
  border-radius: 7px;
  padding: 4px 10px;
  font-size: 0.78rem;
  font-weight: 500;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #374151;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.12s;
}

.btn-detail:hover { background: #f9fafb; }

/* Detail modal */
.detail-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.detail-label {
  font-size: 0.82rem;
  color: #6b7280;
  flex-shrink: 0;
  min-width: 100px;
}

.detail-value {
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
  text-align: right;
}

.detail-divider {
  border-top: 1px solid #f1f3f4;
  margin: 2px 0;
}

.detail-desc-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.detail-desc {
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.6;
  margin: 0;
  background: #f9fafb;
  border-radius: 8px;
  padding: 10px 12px;
}

.btn-approve {
  border-radius: 8px;
  padding: 5px 11px;
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid #bbf7d0;
  background: #f0fdf4;
  color: #15803d;
  cursor: pointer;
  font-family: inherit;
}

.btn-reject {
  border-radius: 8px;
  padding: 5px 11px;
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #b91c1c;
  cursor: pointer;
  font-family: inherit;
}

@media (max-width: 1100px) {
  .grid-4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 740px) {
  .grid-3,
  .grid-4 {
    grid-template-columns: 1fr;
  }
}
</style>
