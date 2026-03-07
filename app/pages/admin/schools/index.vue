<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading" :rows="4" :cols="4" />
    <template v-else>
      <div class="page-header">
        <div>
          <h2 class="page-title">จัดการข้อมูลโรงเรียน</h2>
          <p class="page-desc">ข้อมูลพื้นฐาน, ปีการศึกษา, โครงสร้างหลักสูตร และเอกสาร ปพ.</p>
        </div>
      </div>

      <div class="grid-2">
        <!-- ── School Info ── -->
        <div class="card">
          <div class="card-header-row">
            <h3 class="card-title">ข้อมูลโรงเรียน</h3>
            <div class="card-actions">
              <template v-if="!editingSchool">
                <button type="button" class="btn btn-edit" @click="startEditSchool">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M8.5 1.5l3 3L4 12H1v-3L8.5 1.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" fill="none"/></svg>
                  แก้ไข
                </button>
              </template>
              <template v-else>
                <button type="button" class="btn btn-ghost-sm" @click="cancelEditSchool">ยกเลิก</button>
                <button type="button" class="btn btn-save" @click="saveSchool">บันทึก</button>
              </template>
            </div>
          </div>

          <div class="form-group">
            <label class="field-label">ชื่อโรงเรียน</label>
            <input v-model="schoolForm.name" class="input" :class="{ 'input--disabled': !editingSchool }" :disabled="!editingSchool" type="text" />
          </div>
          <div class="form-group">
            <label class="field-label">รหัสโรงเรียน (สพฐ.)</label>
            <div class="search-select-wrap">
              <input
                v-model="schoolForm.code"
                class="input"
                :class="{ 'input--disabled': !editingSchool }"
                :disabled="!editingSchool"
                list="school-code-list"
                placeholder="พิมพ์หรือเลือกรหัสโรงเรียน"
                autocomplete="off"
              />
              <datalist id="school-code-list">
                <option v-for="c in schoolCodes" :key="c.value" :value="c.value">{{ c.label }}</option>
              </datalist>
            </div>
          </div>
          <div class="form-group">
            <label class="field-label">สังกัด</label>
            <div class="search-select-wrap">
              <input
                v-model="schoolForm.affiliation"
                class="input"
                :class="{ 'input--disabled': !editingSchool }"
                :disabled="!editingSchool"
                list="affiliation-list"
                placeholder="พิมพ์หรือเลือกสังกัด"
                autocomplete="off"
              />
              <datalist id="affiliation-list">
                <option value="สพม. กรุงเทพมหานคร เขต 1" />
                <option value="สพม. กรุงเทพมหานคร เขต 2" />
                <option value="สพป. กรุงเทพมหานคร" />
                <option value="สพม. นนทบุรี" />
                <option value="สพป. นนทบุรี เขต 1" />
                <option value="สพม. ปทุมธานี" />
                <option value="สพม. เชียงใหม่" />
                <option value="สพป. เชียงใหม่ เขต 1" />
                <option value="สพม. ขอนแก่น" />
                <option value="สพม. นครราชสีมา" />
                <option value="อื่น ๆ" />
              </datalist>
            </div>
          </div>
          <div class="form-group">
            <label class="field-label">ที่อยู่</label>
            <textarea v-model="schoolForm.address" class="input textarea" :class="{ 'input--disabled': !editingSchool }" :disabled="!editingSchool" rows="3" />
          </div>
        </div>

        <!-- ── Academic Year ── -->
        <div class="card">
          <div class="card-header-row">
            <h3 class="card-title">ปีการศึกษาปัจจุบัน</h3>
            <div class="card-actions">
              <template v-if="!editingYear">
                <button type="button" class="btn btn-edit" @click="startEditYear">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M8.5 1.5l3 3L4 12H1v-3L8.5 1.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" fill="none"/></svg>
                  แก้ไข
                </button>
              </template>
              <template v-else>
                <button type="button" class="btn btn-ghost-sm" @click="cancelEditYear">ยกเลิก</button>
                <button type="button" class="btn btn-save" @click="saveYear">บันทึก</button>
              </template>
            </div>
          </div>

          <div class="form-group">
            <label class="field-label">ปีการศึกษา</label>
            <div class="search-select-wrap">
              <input
                v-model="yearForm.year"
                class="input"
                :class="{ 'input--disabled': !editingYear }"
                :disabled="!editingYear"
                list="academic-year-list"
                placeholder="เลือกปีการศึกษา"
                autocomplete="off"
              />
              <datalist id="academic-year-list">
                <option value="2568" />
                <option value="2567" />
                <option value="2566" />
                <option value="2565" />
                <option value="2564" />
              </datalist>
            </div>
          </div>
          <div class="form-group">
            <label class="field-label">ภาคเรียนที่</label>
            <div class="search-select-wrap">
              <input
                v-model="yearForm.semester"
                class="input"
                :class="{ 'input--disabled': !editingYear }"
                :disabled="!editingYear"
                list="semester-list"
                placeholder="เลือกภาคเรียน"
                autocomplete="off"
              />
              <datalist id="semester-list">
                <option value="1" />
                <option value="2" />
              </datalist>
            </div>
          </div>
          <div class="form-group">
            <label class="field-label">วันเปิดเรียน</label>
            <input v-model="yearForm.start" class="input" :class="{ 'input--disabled': !editingYear }" :disabled="!editingYear" type="date" />
          </div>
          <div class="form-group">
            <label class="field-label">วันปิดเรียน</label>
            <input v-model="yearForm.end" class="input" :class="{ 'input--disabled': !editingYear }" :disabled="!editingYear" type="date" />
          </div>
        </div>
      </div>

      <!-- ── Curriculum Structure ── -->
      <div class="card full-card">
        <div class="card-header-row">
          <h3 class="card-title">โครงสร้างหลักสูตร</h3>
          <button type="button" class="btn btn-outline" @click="openAddCurriculum">+ เพิ่มกลุ่มสาระ</button>
        </div>
        <AdminDataTable :columns="curriculumCols" :rows="curriculumRows">
          <template #rowActions="{ row }">
            <div class="action-btns">
              <button type="button" class="btn-tiny" @click="openEditCurriculum(row as unknown as CurriculumRow)">แก้ไข</button>
              <button type="button" class="btn-tiny btn-red" @click="openDeleteCurriculum(row as unknown as CurriculumRow)">ลบ</button>
            </div>
          </template>
        </AdminDataTable>
      </div>

      <!-- Curriculum Add/Edit Modal -->
      <AdminAppModal
        v-model="showCurriculumModal"
        :title="editingCurriculum ? 'แก้ไขกลุ่มสาระ' : 'เพิ่มกลุ่มสาระ'"
        size="sm"
        confirm-label="บันทึก"
        @confirm="saveCurriculum"
      >
        <div class="form-grid">
          <div class="form-group form-group--full">
            <label class="field-label">ชื่อกลุ่มสาระ <span class="req">*</span></label>
            <input v-model="curriculumForm.group" class="input" placeholder="เช่น ภาษาไทย" />
          </div>
          <div class="form-group">
            <label class="field-label">จำนวนวิชา</label>
            <input v-model.number="curriculumForm.subjects" class="input" type="number" min="0" placeholder="0" />
          </div>
          <div class="form-group">
            <label class="field-label">ชั่วโมง/สัปดาห์</label>
            <input v-model.number="curriculumForm.hours" class="input" type="number" min="0" placeholder="0" />
          </div>
          <div class="form-group">
            <label class="field-label">หน่วยกิต/ปี</label>
            <input v-model.number="curriculumForm.credit" class="input" type="number" min="0" placeholder="0" />
          </div>
        </div>
      </AdminAppModal>

      <!-- Curriculum Delete Confirm -->
      <AdminAppConfirmModal
        v-model="showCurriculumConfirm"
        :title="`ลบกลุ่มสาระ '${deleteCurriculumTarget?.group}'?`"
        description="ข้อมูลกลุ่มสาระนี้จะถูกลบออกจากโครงสร้างหลักสูตร"
        @confirm="confirmDeleteCurriculum"
      />

      <!-- ── Document exports ── -->
      <div class="card full-card">
        <h3 class="card-title">เอกสารสำคัญ (ปพ.)</h3>
        <p class="card-desc">ส่งออกเอกสารตามระเบียบกระทรวงศึกษาธิการ</p>
        <div class="doc-grid">
          <div v-for="doc in docs" :key="doc.name" class="doc-item">
            <div class="doc-icon">📄</div>
            <div>
              <div class="doc-name">{{ doc.name }}</div>
              <div class="doc-desc">{{ doc.desc }}</div>
            </div>
            <button type="button" class="btn btn-outline doc-btn">ส่งออก</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

definePageMeta({ layout: 'admin' })

const { loading } = usePageLoad()

// ── School codes list ──
const schoolCodes = [
  { value: '1001010101', label: '1001010101 — โรงเรียนตัวอย่างวิทยา' },
  { value: '1001010102', label: '1001010102 — โรงเรียนสาธิต กทม.' },
  { value: '1002010201', label: '1002010201 — โรงเรียนนนทบุรีวิทยา' },
  { value: '1003010301', label: '1003010301 — โรงเรียนปทุมวิทยา' },
]

// ── School form ──
const editingSchool = ref(false)
const schoolForm = reactive({ name: 'โรงเรียนตัวอย่างวิทยา', code: '1001010101', affiliation: 'สพม. กรุงเทพมหานคร เขต 1', address: '123 ถนนวัฒนา แขวงท่าพระ เขตบางกอกใหญ่ กรุงเทพฯ 10160' })
let schoolSnapshot = { ...schoolForm }

function startEditSchool() {
  schoolSnapshot = { ...schoolForm }
  editingSchool.value = true
}
function cancelEditSchool() {
  Object.assign(schoolForm, schoolSnapshot)
  editingSchool.value = false
}
function saveSchool() {
  editingSchool.value = false
}

// ── Year form ──
const editingYear = ref(false)
const yearForm = reactive({ year: '2568', semester: '1', start: '2025-05-12', end: '2025-10-03' })
let yearSnapshot = { ...yearForm }

function startEditYear() {
  yearSnapshot = { ...yearForm }
  editingYear.value = true
}
function cancelEditYear() {
  Object.assign(yearForm, yearSnapshot)
  editingYear.value = false
}
function saveYear() {
  editingYear.value = false
}

// ── Curriculum ──
const curriculumCols = [
  { key: 'group', label: 'กลุ่มสาระ' },
  { key: 'subjects', label: 'จำนวนวิชา' },
  { key: 'hours', label: 'ชั่วโมง/สัปดาห์' },
  { key: 'credit', label: 'หน่วยกิต/ปี' },
]

interface CurriculumRow { group: string; subjects: number; hours: number; credit: number }

const curriculumRows = ref<CurriculumRow[]>([
  { group: 'ภาษาไทย', subjects: 8, hours: 5, credit: 6 },
  { group: 'คณิตศาสตร์', subjects: 6, hours: 5, credit: 6 },
  { group: 'วิทยาศาสตร์', subjects: 10, hours: 6, credit: 8 },
  { group: 'สังคมศึกษา', subjects: 8, hours: 4, credit: 5 },
  { group: 'ภาษาต่างประเทศ', subjects: 9, hours: 5, credit: 6 },
])

const showCurriculumModal = ref(false)
const editingCurriculum = ref(false)
let curriculumEditTarget: CurriculumRow | null = null
const emptyCurriculumForm = (): CurriculumRow => ({ group: '', subjects: 0, hours: 0, credit: 0 })
const curriculumForm = ref<CurriculumRow>(emptyCurriculumForm())

function openAddCurriculum() {
  editingCurriculum.value = false
  curriculumEditTarget = null
  curriculumForm.value = emptyCurriculumForm()
  showCurriculumModal.value = true
}

function openEditCurriculum(row: CurriculumRow) {
  editingCurriculum.value = true
  curriculumEditTarget = row
  curriculumForm.value = { ...row }
  showCurriculumModal.value = true
}

function saveCurriculum() {
  if (!curriculumForm.value.group.trim()) return
  if (editingCurriculum.value && curriculumEditTarget) {
    const idx = curriculumRows.value.indexOf(curriculumEditTarget)
    if (idx !== -1) curriculumRows.value[idx] = { ...curriculumForm.value }
  }
  else {
    curriculumRows.value.push({ ...curriculumForm.value })
  }
  showCurriculumModal.value = false
}

const showCurriculumConfirm = ref(false)
let deleteCurriculumTarget: CurriculumRow | null = null as CurriculumRow | null

function openDeleteCurriculum(row: CurriculumRow) {
  deleteCurriculumTarget = row
  showCurriculumConfirm.value = true
}

function confirmDeleteCurriculum() {
  if (deleteCurriculumTarget)
    curriculumRows.value = curriculumRows.value.filter(r => r !== deleteCurriculumTarget)
  deleteCurriculumTarget = null
  showCurriculumConfirm.value = false
}

const docs = [
  { name: 'ปพ.1', desc: 'ระเบียนแสดงผลการเรียน' },
  { name: 'ปพ.5', desc: 'สมุดรายงานประจำชั้น' },
  { name: 'ปพ.7', desc: 'ใบรับรองการเป็นนักเรียน' },
]
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
  gap: 12px;
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

.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.card {
  background: #fff;
  border: 1px solid #e8eaed;
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.full-card { gap: 14px; }

.card-title {
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0;
  color: #111827;
}

.card-desc {
  color: #6b7280;
  font-size: 0.85rem;
  margin: -6px 0 0;
}

.card-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.field-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #6b7280;
}

.search-select-wrap {
  position: relative;
}

.input {
  border: 1px solid #d1d5db;
  border-radius: 9px;
  padding: 8px 11px;
  font-size: 0.875rem;
  font-family: inherit;
  color: #111827;
  background: #fff;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.12s, background 0.12s;
  outline: none;
}

.input:focus {
  border-color: #6366f1;
}

.input--disabled {
  background: #f9fafb;
  color: #6b7280;
  border-color: #e5e7eb;
  cursor: not-allowed;
}

.textarea {
  resize: vertical;
  min-height: 80px;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: 8px;
  padding: 7px 13px;
  font-size: 0.83rem;
  font-weight: 500;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #111827;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.12s;
  white-space: nowrap;
}

.btn-edit {
  border-color: #bfdbfe;
  background: #eff6ff;
  color: #1d4ed8;
}
.btn-edit:hover { background: #dbeafe; border-color: #93c5fd; }

.btn-save {
  background: #111827;
  color: #fff;
  border-color: #111827;
}
.btn-save:hover { background: #1f2937; }

.btn-ghost-sm {
  border-color: #e5e7eb;
  background: #fff;
  color: #374151;
}
.btn-ghost-sm:hover { background: #f9fafb; }

.btn-outline {
  border-color: #d1d5db;
  background: #fff;
}
.btn-outline:hover { background: #f9fafb; }

.action-btns {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}

.btn-tiny {
  border-radius: 7px;
  padding: 4px 9px;
  font-size: 0.78rem;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  color: #374151;
  cursor: pointer;
  font-family: inherit;
}

.btn-red {
  border-color: #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.form-group--full {
  grid-column: 1 / -1;
}

.req { color: #ef4444; }

/* Docs */
.doc-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.doc-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #f1f3f4;
  border-radius: 10px;
}

.doc-icon { font-size: 1.4rem; }
.doc-name { font-weight: 600; font-size: 0.875rem; }
.doc-desc { font-size: 0.8rem; color: #6b7280; }
.doc-btn { margin-left: auto; }

@media (max-width: 760px) {
  .grid-2 { grid-template-columns: 1fr; }
}
</style>
