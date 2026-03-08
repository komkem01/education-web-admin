<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading" :show-cards="true" :rows="4" :cols="5" />
    <template v-else>
    <div class="page-header">
      <div>
        <h2 class="page-title">ยินดีต้อนรับ สมชาย มั่นคง</h2>
        <p class="page-desc">ภาพรวมระบบ — โรงเรียนตัวอย่างวิทยา · ปีการศึกษา 2568</p>
      </div>
    </div>

    <div class="api-session section-gap">
      <div class="api-session-title">ข้อมูลผู้ใช้จาก API</div>
      <p v-if="mePending" class="api-session-text">กำลังโหลดข้อมูล...</p>
      <p v-else-if="meError" class="api-session-text api-session-error">ไม่สามารถดึงข้อมูลจาก /auth/me ได้</p>
      <p v-else class="api-session-text">
        member: <strong>{{ meData?.member_id }}</strong>
        · role: <strong>{{ meData?.role }}</strong>
        · school: <strong>{{ meData?.school_id }}</strong>
        · หมดอายุ: <strong>{{ meData?.expires_at }}</strong>
      </p>
    </div>

    <!-- ── Metric Cards ── -->
    <div class="grid-4 section-gap">
      <AdminMetricCard icon="👥" label="บุคลากรทั้งหมด" :value="String(personnelRows.length)" :sub="`อยู่ในระบบ ${activePersonnelCount} คน`" :trend="4" accent="#6366f1" />
      <AdminMetricCard icon="🎓" label="ครูทั้งหมด" :value="String(teacherRows.length)" :sub="`สอนอยู่ ${activeTeacherCount} คน`" :trend="2" accent="#0ea5e9" />
      <AdminMetricCard icon="📚" label="นักเรียนทั้งหมด" :value="studentRows.length.toLocaleString()" :sub="`ลงทะเบียนแล้ว ${registeredStudentCount} คน`" :trend="5" accent="#10b981" />
      <AdminMetricCard icon="✅" label="คำขอรออนุมัติ" :value="String(pendingCount)" :sub="`ทั้งหมด ${approvalRows.length} รายการ`" :trend="-2" accent="#f59e0b" />
    </div>

    <!-- ── Quick Stats ── -->
    <div class="grid-3 section-gap">
      <div class="stat-card">
        <div class="stat-label">งานวิชาการ</div>
        <div class="stat-row"><span>รายวิชาที่เปิดสอน</span><strong>{{ courseRows.length }}</strong></div>
        <div class="stat-row"><span>นักเรียนติด 0/ร/มส</span><strong>{{ failGradeCount }}</strong></div>
        <div class="stat-row"><span>เอกสาร ปพ. ค้างออก</span><strong>7</strong></div>
        <NuxtLink to="/admin/school" class="stat-link">ไปหน้าวิชาการ →</NuxtLink>
      </div>

      <div class="stat-card">
        <div class="stat-label">งานทะเบียน</div>
        <div class="stat-row"><span>ย้ายเข้าเทอมนี้</span><strong>8</strong></div>
        <div class="stat-row"><span>ย้ายออกเทอมนี้</span><strong>3</strong></div>
        <div class="stat-row"><span>รอเลื่อนชั้นปี</span><strong>234</strong></div>
        <NuxtLink to="/admin/students" class="stat-link">ไปหน้านักเรียน →</NuxtLink>
      </div>

      <div class="stat-card">
        <div class="stat-label">งานปกครอง</div>
        <div class="stat-row"><span>นักเรียนถูกตัดคะแนน</span><strong>{{ lowDisciplineCount }}</strong></div>
        <div class="stat-row"><span>แจ้งเตือนผู้ปกครองวันนี้</span><strong>4</strong></div>
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
import { usePersonnelsData } from '~/composables/usePersonnelsData'
import { useTeachersData } from '~/composables/useTeachersData'
import { useStudentsData } from '~/composables/useStudentsData'
import { useApprovalsData, type ApprovalRow } from '~/composables/useApprovalsData'
import { useCoursesData } from '~/composables/useCoursesData'
import { useGradesData, getGrade } from '~/composables/useGradesData'

definePageMeta({ layout: 'admin' })

const { loading } = usePageLoad()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('edu_auth_token')

const { data: meResponse, pending: mePending, error: meError } = useAsyncData(
  'admin-auth-me',
  () => $fetch<{ data: { member_id: string; school_id: string; role: string; expires_at: string } }>(`${config.public.apiBase}/auth/me`, {
    headers: {
      Authorization: `Bearer ${authToken.value}`,
    },
  }),
  { server: false },
)

const meData = computed(() => meResponse.value?.data)

const { rows: personnelRows } = usePersonnelsData()
const { rows: teacherRows } = useTeachersData()
const { rows: studentRows } = useStudentsData()
const { rows: approvalRows } = useApprovalsData()
const { rows: courseRows } = useCoursesData()
const { rows: gradeRows } = useGradesData()

// ── Metric cards ──
const activePersonnelCount = computed(() => personnelRows.value.filter(r => r.status === 'ใช้งาน').length)
const activeTeacherCount = computed(() => teacherRows.value.filter(r => r.status === 'อนุมัติแล้ว').length)
const registeredStudentCount = computed(() => studentRows.value.filter(r => r.status === 'ปกติ').length)
const pendingCount = computed(() => approvalRows.value.filter(r => r.status === 'รออนุมัติ').length)

// ── Quick stats ──
const failGradeCount = computed(() => gradeRows.value.filter(r => getGrade(r) === '0').length)
const lowDisciplineCount = computed(() => studentRows.value.filter(s => s.discipline < 70).length)

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

function confirmApprove() {
  if (pendingRow.value) pendingRow.value.status = 'อนุมัติแล้ว'
  showApproveModal.value = false
  pendingRow.value = null
}

function confirmReject() {
  if (pendingRow.value) pendingRow.value.status = 'ปฏิเสธ'
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
  background: #f9fafb;
  color: #374151;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.12s;
}

.btn-detail:hover { background: #f3f4f6; }

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
