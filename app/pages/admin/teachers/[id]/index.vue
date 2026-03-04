<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading" :rows="5" :cols="2" />
    <template v-else>
      <div v-if="!record" class="not-found">
        <p class="not-found-text">ไม่พบข้อมูลครู</p>
        <button class="btn btn-primary" @click="navigateTo('/admin/teachers')">← กลับรายการ</button>
      </div>

      <template v-else>
        <!-- Header -->
        <div class="page-header">
          <div class="header-left">
            <button class="btn btn-back" @click="navigateTo('/admin/teachers')">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7 2L3 6l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              กลับ
            </button>
            <div>
              <h2 class="page-title">{{ record.name }}</h2>
              <p class="page-desc">{{ record.subject }} · รหัส {{ record.id }}</p>
            </div>
          </div>
          <div class="header-actions">
            <AdminStatusBadge
              :label="record.status"
              :variant="record.status === 'อนุมัติแล้ว' ? 'approved' : record.status === 'รออนุมัติ' ? 'pending' : 'default'"
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
            <p class="section-title">ข้อมูลระบบ</p>
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">รหัสครู</span><span class="detail-value mono">{{ record.id }}</span></div>
              <div class="detail-item"><span class="detail-label">สถานะบัญชี</span><span class="detail-value"><AdminStatusBadge :label="record.status" :variant="record.status === 'อนุมัติแล้ว' ? 'approved' : record.status === 'รออนุมัติ' ? 'pending' : 'default'" /></span></div>
              <div class="detail-item"><span class="detail-label">กลุ่มสาระ</span><span class="detail-value">{{ record.subject }}</span></div>
              <div class="detail-item"><span class="detail-label">ครูที่ปรึกษาห้อง</span><span class="detail-value">{{ record.class || '—' }}</span></div>
              <div class="detail-item"><span class="detail-label">วิชาที่สอน</span><span class="detail-value">{{ record.courses }} วิชา</span></div>
            </div>
          </div>
          <div class="detail-card" style="margin-top: 16px;">
            <p class="section-title">ข้อมูลส่วนตัว</p>
            <div class="detail-grid">
              <div class="detail-item detail-item--full"><span class="detail-label">ชื่อ-นามสกุล</span><span class="detail-value">{{ record.name }}</span></div>
              <div class="detail-item"><span class="detail-label">เลขบัตรประชาชน</span><span class="detail-value mono">{{ record.idCard || '—' }}</span></div>
              <div class="detail-item"><span class="detail-label">วันเกิด</span><span class="detail-value">{{ record.birthdate || '—' }}</span></div>
              <div class="detail-item"><span class="detail-label">เบอร์โทรศัพท์</span><span class="detail-value">{{ record.phone || '—' }}</span></div>
              <div class="detail-item"><span class="detail-label">อีเมล</span><span class="detail-value">{{ record.email || '—' }}</span></div>
              <div class="detail-item detail-item--full"><span class="detail-label">ที่อยู่</span><span class="detail-value">{{ record.address || '—' }}</span></div>
            </div>
          </div>
        </div>

        <!-- Tab: ประวัติการศึกษา -->
        <div v-show="activeTab === 'education'">
          <div class="detail-card">
            <p class="section-title">ประวัติการศึกษา</p>
            <div v-if="record.education.length === 0" class="empty-state">ยังไม่มีข้อมูลประวัติการศึกษา</div>
            <div v-for="(edu, idx) in record.education" :key="idx" class="history-view-card">
              <div class="hvc-degree">{{ edu.degree }}</div>
              <div class="hvc-major">{{ edu.major }}</div>
              <div class="hvc-row">
                <span class="hvc-inst">{{ edu.institution }}</span>
                <span class="hvc-meta">ปี {{ edu.year }}</span>
                <span v-if="edu.gpa" class="hvc-meta">GPA {{ edu.gpa }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: ประวัติการทำงาน -->
        <div v-show="activeTab === 'work'">
          <div class="detail-card">
            <p class="section-title">ประวัติการทำงาน</p>
            <div v-if="record.workHistory.length === 0" class="empty-state">ยังไม่มีข้อมูลประวัติการทำงาน</div>
            <div v-for="(work, idx) in record.workHistory" :key="idx" class="history-view-card">
              <div class="hvc-degree">{{ work.position }}</div>
              <div class="hvc-major">{{ work.organization }}</div>
              <div class="hvc-row">
                <span class="hvc-meta">{{ work.startYear }} — {{ work.endYear || 'ปัจจุบัน' }}</span>
                <span v-if="work.note" class="hvc-note">{{ work.note }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Edit Modal (tabbed) -->
      <AdminAppModal
        v-model="showModal"
        title="แก้ไขข้อมูลครู"
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
            <span>รหัสครู</span>
            <div class="id-display"><span class="id-badge">{{ form.id }}</span><span class="id-hint">รหัสไม่สามารถแก้ไขได้</span></div>
          </label>
          <label class="field">
            <span>ชื่อ-นามสกุล <span class="req">*</span></span>
            <input v-model="form.name" class="input" type="text" placeholder="นาย/นาง/นางสาว..." />
            <span v-if="formErrors.name" class="field-error">{{ formErrors.name }}</span>
          </label>
          <label class="field">
            <span>กลุ่มสาระ</span>
            <select v-model="form.subject" class="input">
              <option v-for="s in subjects" :key="s">{{ s }}</option>
            </select>
          </label>
          <label class="field">
            <span>ครูที่ปรึกษาห้อง</span>
            <input v-model="form.class" class="input" type="text" placeholder="ม.1/1 (เว้นว่างถ้าไม่มี)" />
          </label>
          <label class="field">
            <span>จำนวนวิชาที่สอน</span>
            <input v-model.number="form.courses" class="input" type="number" min="0" placeholder="0" />
          </label>
          <label class="field">
            <span>สถานะบัญชี</span>
            <select v-model="form.status" class="input">
              <option>อนุมัติแล้ว</option>
              <option>รออนุมัติ</option>
              <option>ระงับ</option>
            </select>
          </label>
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
          <label class="field">
            <span>อีเมล</span>
            <input v-model="form.email" class="input" type="email" placeholder="teacher@school.ac.th" />
          </label>
          <label class="field field--full">
            <span>ที่อยู่</span>
            <textarea v-model="form.address" class="input form-textarea" placeholder="ที่อยู่ปัจจุบัน" />
          </label>
        </div>

        <!-- Education tab -->
        <div v-show="activeFormTab === 'education'">
          <div v-for="(edu, idx) in form.education" :key="idx" class="history-card">
            <div class="history-card-header">
              <span class="history-card-no">ที่ {{ idx + 1 }}</span>
              <button type="button" class="btn-remove" @click="removeEducation(idx)">ลบ</button>
            </div>
            <div class="form-grid">
              <label class="field">
                <span>วุฒิการศึกษา</span>
                <select v-model="edu.degree" class="input">
                  <option>ปริญญาตรี</option>
                  <option>ปริญญาโท</option>
                  <option>ปริญญาเอก</option>
                  <option>อื่น ๆ</option>
                </select>
              </label>
              <label class="field">
                <span>สาขาวิชา</span>
                <input v-model="edu.major" class="input" type="text" placeholder="สาขา..." />
              </label>
              <label class="field field--full">
                <span>สถาบัน</span>
                <input v-model="edu.institution" class="input" type="text" placeholder="ชื่อมหาวิทยาลัย / วิทยาลัย" />
              </label>
              <label class="field">
                <span>ปีที่สำเร็จ</span>
                <input v-model="edu.year" class="input" type="text" placeholder="2550" />
              </label>
              <label class="field">
                <span>เกรดเฉลี่ย</span>
                <input v-model="edu.gpa" class="input" type="text" placeholder="3.50" />
              </label>
            </div>
          </div>
          <button type="button" class="btn-add-history" @click="addEducation">+ เพิ่มประวัติการศึกษา</button>
        </div>

        <!-- Work tab -->
        <div v-show="activeFormTab === 'work'">
          <div v-for="(work, idx) in form.workHistory" :key="idx" class="history-card">
            <div class="history-card-header">
              <span class="history-card-no">ที่ {{ idx + 1 }}</span>
              <button type="button" class="btn-remove" @click="removeWork(idx)">ลบ</button>
            </div>
            <div class="form-grid">
              <label class="field">
                <span>ตำแหน่ง</span>
                <input v-model="work.position" class="input" type="text" placeholder="ตำแหน่งงาน..." />
              </label>
              <label class="field">
                <span>หน่วยงาน / สถานที่</span>
                <input v-model="work.organization" class="input" type="text" placeholder="ชื่อสถานที่ทำงาน" />
              </label>
              <label class="field">
                <span>ปีที่เริ่มงาน</span>
                <input v-model="work.startYear" class="input" type="text" placeholder="2550" />
              </label>
              <label class="field">
                <span>ปีที่สิ้นสุด</span>
                <input v-model="work.endYear" class="input" type="text" placeholder="ปัจจุบัน" />
              </label>
              <label class="field field--full">
                <span>หมายเหตุ</span>
                <input v-model="work.note" class="input" type="text" placeholder="หมายเหตุ (ถ้ามี)" />
              </label>
            </div>
          </div>
          <button type="button" class="btn-add-history" @click="addWork">+ เพิ่มประวัติการทำงาน</button>
        </div>
      </AdminAppModal>

      <!-- Confirm Delete -->
      <AdminAppConfirmModal
        v-model="showConfirm"
        :description="`ต้องการลบครู '${record?.name}' ออกจากระบบหรือไม่?`"
        @confirm="confirmDelete"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTeachersData, type TeacherRow, type EducationRecord, type WorkRecord } from '~/composables/useTeachersData'

definePageMeta({ layout: 'admin' })

const { loading } = usePageLoad()
const route = useRoute()
const { rows } = useTeachersData()

const id = computed(() => decodeURIComponent(String(route.params.id ?? '')))
const record = computed(() => rows.value.find(r => r.id === id.value) ?? null)

const subjects = ['ภาษาไทย', 'คณิตศาสตร์', 'วิทยาศาสตร์', 'สังคมศึกษา', 'ภาษาต่างประเทศ', 'ศิลปะ', 'พลศึกษา']

const tabs = [
  { key: 'general', label: 'ข้อมูลทั่วไป' },
  { key: 'education', label: 'ประวัติการศึกษา' },
  { key: 'work', label: 'ประวัติการทำงาน' },
]
const activeTab = ref('general')

// ── Edit ──
const showModal = ref(false)
const activeFormTab = ref('general')
const formTabs = [
  { key: 'general', label: 'ข้อมูลทั่วไป' },
  { key: 'education', label: 'ประวัติการศึกษา' },
  { key: 'work', label: 'ประวัติการทำงาน' },
]

const emptyForm = (): TeacherRow => ({
  id: '', name: '', subject: 'ภาษาไทย', class: '', courses: 0, status: 'รออนุมัติ',
  idCard: '', birthdate: '', phone: '', email: '', address: '',
  education: [], workHistory: [],
})
const form = ref<TeacherRow>(emptyForm())
const formErrors = ref({ name: '' })

const emptyEdu = (): EducationRecord => ({ degree: 'ปริญญาตรี', major: '', institution: '', year: '', gpa: '' })
const emptyWork = (): WorkRecord => ({ position: '', organization: '', startYear: '', endYear: 'ปัจจุบัน', note: '' })

function addEducation() { form.value.education.push(emptyEdu()) }
function removeEducation(idx: number) { form.value.education.splice(idx, 1) }
function addWork() { form.value.workHistory.push(emptyWork()) }
function removeWork(idx: number) { form.value.workHistory.splice(idx, 1) }

function openEdit() {
  if (!record.value) return
  form.value = {
    ...record.value,
    education: record.value.education.map(e => ({ ...e })),
    workHistory: record.value.workHistory.map(w => ({ ...w })),
  }
  formErrors.value = { name: '' }
  activeFormTab.value = 'general'
  showModal.value = true
}

function saveRow() {
  formErrors.value = { name: '' }
  if (!form.value.name.trim()) { formErrors.value.name = 'กรุณาระบุชื่อ-นามสกุล'; activeFormTab.value = 'general'; return }
  if (!record.value) return
  const idx = rows.value.findIndex(r => r.id === record.value!.id)
  if (idx !== -1) rows.value[idx] = {
    ...form.value,
    education: form.value.education.map(e => ({ ...e })),
    workHistory: form.value.workHistory.map(w => ({ ...w })),
  }
  showModal.value = false
}

// ── Delete ──
const showConfirm = ref(false)

function confirmDelete() {
  if (!record.value) return
  rows.value = rows.value.filter(r => r.id !== record.value!.id)
  showConfirm.value = false
  navigateTo('/admin/teachers')
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
.btn-edit { border-color: #d1d5db; background: #f9fafb; }
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
.history-view-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 16px; margin-bottom: 10px; background: #fff; }
.history-view-card:last-child { margin-bottom: 0; }
.hvc-degree { font-size: 0.875rem; font-weight: 700; color: #111827; }
.hvc-major { font-size: 0.85rem; color: #4f46e5; font-weight: 500; margin-top: 2px; }
.hvc-row { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
.hvc-inst { font-size: 0.82rem; color: #374151; }
.hvc-meta { font-size: 0.78rem; color: #6b7280; background: #f3f4f6; border-radius: 999px; padding: 2px 8px; }
.hvc-note { font-size: 0.78rem; color: #9ca3af; }
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
.history-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; margin-bottom: 12px; background: #fafafa; }
.history-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.history-card-no { font-size: 0.8rem; font-weight: 600; color: #6b7280; }
.btn-remove { font-size: 0.75rem; padding: 3px 8px; border-radius: 6px; border: 1px solid #fecaca; background: #fef2f2; color: #b91c1c; cursor: pointer; font-family: inherit; }
.btn-remove:hover { background: #fee2e2; }
.btn-add-history { width: 100%; padding: 9px; border: 1px dashed #d1d5db; border-radius: 8px; background: #f9fafb; color: #6b7280; font-size: 0.875rem; font-family: inherit; cursor: pointer; transition: all 0.12s; }
.btn-add-history:hover { border-color: #6366f1; color: #4f46e5; background: #eef2ff; }
.not-found { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 60px 0; color: #9ca3af; }
.not-found-text { font-size: 1rem; }
</style>
