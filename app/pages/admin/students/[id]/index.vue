<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading" :rows="5" :cols="2" />
    <template v-else>
      <div v-if="!record" class="not-found">
        <p class="not-found-text">ไม่พบข้อมูลนักเรียน</p>
        <button class="btn btn-primary" @click="navigateTo('/admin/students')">← กลับรายการ</button>
      </div>

      <template v-else>
        <!-- Header -->
        <div class="page-header">
          <div class="header-left">
            <button class="btn btn-back" @click="navigateTo('/admin/students')">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7 2L3 6l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              กลับ
            </button>
            <div>
              <h2 class="page-title">{{ record.name }}</h2>
              <p class="page-desc">{{ record.class }} · เลขประจำตัว {{ record.id }}</p>
            </div>
          </div>
          <div class="header-actions">
            <AdminStatusBadge
              :label="record.status"
              :variant="record.status === 'ปกติ' ? 'approved' : record.status === 'รออนุมัติ' ? 'pending' : 'default'"
            />
            <button class="btn btn-edit" @click="openEdit">แก้ไข</button>
            <button class="btn btn-danger" @click="showConfirm = true">ลบ</button>
          </div>
        </div>

        <!-- Tab bar -->
        <div class="tab-bar">
          <button v-for="t in tabs" :key="t.key" type="button" class="tab-btn" :class="{ 'tab-btn--active': activeTab === t.key }" @click="activeTab = t.key">
            {{ t.label }}
          </button>
        </div>

        <!-- Tab: ข้อมูลทั่วไป -->
        <div v-show="activeTab === 'general'">
          <div class="detail-card">
            <p class="section-title">ข้อมูลการเรียน</p>
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">เลขประจำตัว</span><span class="detail-value mono">{{ record.id }}</span></div>
              <div class="detail-item"><span class="detail-label">สถานะ</span><span class="detail-value"><AdminStatusBadge :label="record.status" :variant="record.status === 'ปกติ' ? 'approved' : record.status === 'รออนุมัติ' ? 'pending' : 'default'" /></span></div>
              <div class="detail-item"><span class="detail-label">ชั้น/ห้อง</span><span class="detail-value">{{ record.class || '—' }}</span></div>
              <div class="detail-item"><span class="detail-label">ครูที่ปรึกษา</span><span class="detail-value">{{ record.advisor || '—' }}</span></div>
              <div class="detail-item"><span class="detail-label">GPA</span><span class="detail-value">{{ record.gpa }}</span></div>
              <div class="detail-item"><span class="detail-label">คะแนนประพฤติ</span><span class="detail-value">{{ record.discipline }} / 100</span></div>
            </div>
          </div>
        </div>

        <!-- Tab: ข้อมูลส่วนตัว -->
        <div v-show="activeTab === 'personal'">
          <div class="detail-card">
            <p class="section-title">ข้อมูลส่วนตัว</p>
            <div class="detail-grid">
              <div class="detail-item detail-item--full"><span class="detail-label">ชื่อ-นามสกุล</span><span class="detail-value">{{ record.name }}</span></div>
              <div class="detail-item"><span class="detail-label">เลขบัตรประชาชน</span><span class="detail-value mono">{{ record.idCard || '—' }}</span></div>
              <div class="detail-item"><span class="detail-label">วันเกิด</span><span class="detail-value">{{ record.birthdate || '—' }}</span></div>
              <div class="detail-item"><span class="detail-label">เบอร์โทรศัพท์</span><span class="detail-value">{{ record.phone || '—' }}</span></div>
              <div class="detail-item detail-item--full"><span class="detail-label">ที่อยู่</span><span class="detail-value">{{ record.address || '—' }}</span></div>
            </div>
          </div>
        </div>

        <!-- Tab: ข้อมูลผู้ปกครอง -->
        <div v-show="activeTab === 'parent'">
          <div class="detail-card">
            <p class="section-title">ข้อมูลผู้ปกครอง</p>
            <div v-if="!record.parentName" class="empty-state">ยังไม่มีข้อมูลผู้ปกครอง</div>
            <div v-else class="detail-grid">
              <div class="detail-item detail-item--full"><span class="detail-label">ชื่อ-นามสกุล</span><span class="detail-value">{{ record.parentName }}</span></div>
              <div class="detail-item"><span class="detail-label">เบอร์โทรศัพท์</span><span class="detail-value">{{ record.parentPhone || '—' }}</span></div>
              <div class="detail-item"><span class="detail-label">ความสัมพันธ์</span><span class="detail-value">{{ record.parentRelation || '—' }}</span></div>
            </div>
          </div>
        </div>
      </template>

      <!-- Edit Modal -->
      <AdminAppModal
        v-model="showModal"
        title="แก้ไขข้อมูลนักเรียน"
        size="md"
        confirm-label="บันทึก"
        @confirm="saveRow"
      >
        <div class="tab-bar tab-bar--sm">
          <button v-for="t in formTabs" :key="t.key" type="button" class="tab-btn" :class="{ 'tab-btn--active': activeFormTab === t.key }" @click="activeFormTab = t.key">{{ t.label }}</button>
        </div>

        <!-- General tab -->
        <div v-show="activeFormTab === 'general'" class="form-grid">
          <label class="field">
            <span>เลขประจำตัว</span>
            <div class="id-display"><span class="id-badge">{{ form.id }}</span><span class="id-hint">รหัสไม่สามารถแก้ไขได้</span></div>
          </label>
          <label class="field">
            <span>ชื่อ-นามสกุล <span class="req">*</span></span>
            <input v-model="form.name" class="input" type="text" placeholder="ชื่อ-นามสกุล" />
            <span v-if="formErrors.name" class="field-error">{{ formErrors.name }}</span>
          </label>
          <label class="field">
            <span>ชั้น/ห้อง</span>
            <input v-model="form.class" class="input" type="text" placeholder="ม.1/1" />
          </label>
          <label class="field">
            <span>ครูที่ปรึกษา</span>
            <input v-model="form.advisor" class="input" type="text" placeholder="ชื่อครูที่ปรึกษา" />
          </label>
          <label class="field">
            <span>GPA</span>
            <input v-model="form.gpa" class="input" type="text" placeholder="0.00" />
          </label>
          <label class="field">
            <span>คะแนนประพฤติ</span>
            <input v-model.number="form.discipline" class="input" type="number" min="0" max="100" placeholder="100" />
          </label>
          <label class="field field--full">
            <span>สถานะ</span>
            <select v-model="form.status" class="input">
              <option>ปกติ</option>
              <option>รออนุมัติ</option>
              <option>ย้ายออก</option>
              <option>ลาออก</option>
            </select>
          </label>
        </div>

        <!-- Personal tab -->
        <div v-show="activeFormTab === 'personal'" class="form-grid">
          <label class="field">
            <span>เลขบัตรประชาชน</span>
            <input v-model="form.idCard" class="input" type="text" placeholder="x-xxxx-xxxxx-xx-x" />
          </label>
          <label class="field">
            <span>วันเกิด</span>
            <input v-model="form.birthdate" class="input" type="date" />
          </label>
          <label class="field">
            <span>เบอร์โทรศัพท์</span>
            <input v-model="form.phone" class="input" type="text" placeholder="08x-xxx-xxxx" />
          </label>
          <label class="field field--full">
            <span>ที่อยู่</span>
            <textarea v-model="form.address" class="input form-textarea" placeholder="ที่อยู่ปัจจุบัน" />
          </label>
        </div>

        <!-- Parent tab -->
        <div v-show="activeFormTab === 'parent'" class="form-grid">
          <label class="field field--full">
            <span>ชื่อ-นามสกุล ผู้ปกครอง</span>
            <input v-model="form.parentName" class="input" type="text" placeholder="นาย/นาง/นางสาว..." />
          </label>
          <label class="field">
            <span>เบอร์โทรศัพท์</span>
            <input v-model="form.parentPhone" class="input" type="text" placeholder="08x-xxx-xxxx" />
          </label>
          <label class="field">
            <span>ความสัมพันธ์</span>
            <select v-model="form.parentRelation" class="input">
              <option value="">— เลือก —</option>
              <option>บิดา</option>
              <option>มารดา</option>
              <option>ผู้ปกครอง</option>
              <option>อื่น ๆ</option>
            </select>
          </label>
        </div>
      </AdminAppModal>

      <!-- Confirm Delete -->
      <AdminAppConfirmModal
        v-model="showConfirm"
        :description="`ต้องการลบนักเรียน '${record?.name}' ออกจากระบบหรือไม่?`"
        @confirm="confirmDelete"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStudentsData, type StudentRow } from '~/composables/useStudentsData'

definePageMeta({ layout: 'admin' })

const { loading } = usePageLoad()
const route = useRoute()
const { rows } = useStudentsData()

const id = computed(() => decodeURIComponent(String(route.params.id ?? '')))
const record = computed(() => rows.value.find(r => r.id === id.value) ?? null)

const tabs = [
  { key: 'general', label: 'ข้อมูลทั่วไป' },
  { key: 'personal', label: 'ข้อมูลส่วนตัว' },
  { key: 'parent', label: 'ข้อมูลผู้ปกครอง' },
]
const activeTab = ref('general')

// ── Edit ──
const showModal = ref(false)
const activeFormTab = ref('general')
const formTabs = [
  { key: 'general', label: 'ข้อมูลทั่วไป' },
  { key: 'personal', label: 'ข้อมูลส่วนตัว' },
  { key: 'parent', label: 'ข้อมูลผู้ปกครอง' },
]

const emptyForm = (): StudentRow => ({
  id: '', name: '', class: '', advisor: '', gpa: '0.00', discipline: 100, status: 'ปกติ',
  idCard: '', birthdate: '', phone: '', address: '',
  parentName: '', parentPhone: '', parentRelation: '',
})
const form = ref<StudentRow>(emptyForm())
const formErrors = ref({ name: '' })

function openEdit() {
  if (!record.value) return
  form.value = { ...record.value }
  formErrors.value = { name: '' }
  activeFormTab.value = 'general'
  showModal.value = true
}

function saveRow() {
  formErrors.value = { name: '' }
  if (!form.value.name.trim()) { formErrors.value.name = 'กรุณาระบุชื่อ-นามสกุล'; activeFormTab.value = 'general'; return }
  if (!record.value) return
  const idx = rows.value.findIndex(r => r.id === record.value!.id)
  if (idx !== -1) rows.value[idx] = { ...form.value }
  showModal.value = false
}

// ── Delete ──
const showConfirm = ref(false)

function confirmDelete() {
  if (!record.value) return
  rows.value = rows.value.filter(r => r.id !== record.value!.id)
  showConfirm.value = false
  navigateTo('/admin/students')
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 18px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.header-left { display: flex; align-items: flex-start; gap: 12px; }
.header-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.page-title { font-size: 1.3rem; font-weight: 700; margin: 0; color: #111827; }
.page-desc { color: #6b7280; margin-top: 4px; font-size: 0.85rem; }
.btn { display: inline-flex; align-items: center; gap: 5px; border-radius: 8px; padding: 8px 14px; font-size: 0.875rem; font-weight: 500; border: 1px solid #d1d5db; background: #fff; color: #374151; cursor: pointer; font-family: inherit; transition: background 0.12s; }
.btn:hover { background: #f9fafb; }
.btn-back { color: #6b7280; padding: 7px 12px; font-size: 0.82rem; margin-top: 2px; }
.btn-primary { background: #111827; color: #fff; border-color: #111827; }
.btn-edit { border-color: #bfdbfe; background: #eff6ff; color: #1d4ed8; }
.btn-edit:hover { background: #dbeafe; border-color: #93c5fd; }
.btn-danger { border-color: #fecaca; background: #fef2f2; color: #b91c1c; }
.btn-danger:hover { background: #fee2e2; }
.tab-bar { display: flex; gap: 2px; border-bottom: 2px solid #e5e7eb; }
.tab-bar--sm { margin-bottom: 16px; }
.tab-btn { padding: 8px 16px; font-size: 0.875rem; font-weight: 500; color: #6b7280; background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; cursor: pointer; font-family: inherit; transition: color 0.12s, border-color 0.12s; }
.tab-btn:hover { color: #374151; }
.tab-btn--active { color: #4f46e5; border-bottom-color: #4f46e5; }
.detail-card { background: #fff; border: 1px solid #e8eaed; border-radius: 14px; padding: 24px; }
.section-title { font-size: 0.78rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 18px; padding-bottom: 10px; border-bottom: 1px solid #f3f4f6; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px 32px; }
.detail-item { display: flex; flex-direction: column; gap: 5px; }
.detail-item--full { grid-column: 1 / -1; }
.detail-label { font-size: 0.72rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
.detail-value { font-size: 0.95rem; color: #111827; font-weight: 500; }
.detail-value.mono { font-family: monospace; letter-spacing: 0.04em; }
.empty-state { text-align: center; padding: 32px 0; color: #9ca3af; font-size: 0.875rem; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 5px; font-size: 0.83rem; font-weight: 500; color: #374151; }
.field--full { grid-column: 1 / -1; }
.req { color: #ef4444; }
.field-error { font-size: 0.75rem; color: #ef4444; }
.input { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 12px; font-size: 0.875rem; font-family: inherit; background: #fff; color: #111827; outline: none; transition: border-color 0.12s; }
.input:focus { border-color: #6366f1; }
.form-textarea { min-height: 68px; resize: vertical; }
.id-display { display: flex; align-items: center; gap: 8px; padding: 7px 10px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; }
.id-badge { font-size: 0.875rem; font-weight: 600; color: #374151; font-family: monospace; letter-spacing: 0.05em; }
.id-hint { font-size: 0.75rem; color: #9ca3af; }
.not-found { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 60px 0; color: #9ca3af; }
.not-found-text { font-size: 1rem; }
</style>
