<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading" :rows="4" :cols="4" />
    <template v-else>
      <div class="page-header">
        <div>
          <h2 class="page-title">จัดการข้อมูลโรงเรียน</h2>
          <p class="page-desc">ข้อมูลพื้นฐาน, ปีการศึกษา, โครงสร้างหลักสูตร และเอกสาร ปพ.</p>
           <p v-if="schoolLoading" class="page-loading">กำลังโหลดข้อมูลโรงเรียน...</p>
          <p v-if="schoolError" class="page-error">{{ schoolError }}</p>
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
            <label class="field-label">โลโก้โรงเรียน (URL)</label>
            <input v-model="schoolForm.logoUrl" class="input" :class="{ 'input--disabled': !editingSchool }" :disabled="!editingSchool" type="url" placeholder="https://..." />
          </div>
          <div class="form-group">
            <label class="field-label">สีธีมโรงเรียน</label>
            <input v-model="schoolForm.themeColor" class="input" :class="{ 'input--disabled': !editingSchool }" :disabled="!editingSchool" type="text" placeholder="#1d4ed8" />
          </div>
          <div class="form-group">
            <label class="field-label">ที่อยู่</label>
            <textarea v-model="schoolForm.address" class="input textarea" :class="{ 'input--disabled': !editingSchool }" :disabled="!editingSchool" rows="3" />
          </div>
          <div class="form-group">
            <label class="field-label">รายละเอียด</label>
            <textarea v-model="schoolForm.description" class="input textarea" :class="{ 'input--disabled': !editingSchool }" :disabled="!editingSchool" rows="2" />
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

          <p v-if="yearLoading" class="inline-loading">กำลังโหลดปีการศึกษา...</p>
          <p v-if="yearError" class="inline-error">{{ yearError }}</p>

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
                <option v-for="item in academicYearOptions" :key="item" :value="item" />
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
                <option v-for="item in semesterOptions" :key="item" :value="item" />
              </datalist>
            </div>
          </div>
          <div class="form-group">
            <label class="field-label">วันเปิดเรียน</label>
            <input
              v-if="editingYear"
              v-model="yearForm.start"
              class="input"
              type="date"
            />
            <input
              v-else
              :value="formatDateThaiDisplay(yearForm.start)"
              class="input input--disabled"
              disabled
              type="text"
            />
          </div>
          <div class="form-group">
            <label class="field-label">วันปิดเรียน</label>
            <input
              v-if="editingYear"
              v-model="yearForm.end"
              class="input"
              type="date"
            />
            <input
              v-else
              :value="formatDateThaiDisplay(yearForm.end)"
              class="input input--disabled"
              disabled
              type="text"
            />
          </div>
        </div>
      </div>

      <!-- ── Curriculum Structure ── -->
      <div class="card full-card">
        <div class="card-header-row">
          <h3 class="card-title">โครงสร้างหลักสูตร</h3>
          <button type="button" class="btn btn-outline" @click="refreshCurriculum">รีเฟรช</button>
        </div>
        <p v-if="curriculumLoading" class="inline-loading">กำลังโหลดโครงสร้างหลักสูตร...</p>
        <p v-if="curriculumError" class="inline-error">{{ curriculumError }}</p>
        <AdminDataTable :columns="curriculumCols" :rows="curriculumRows" />
      </div>

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
import { computed, ref, reactive, watch } from 'vue'

definePageMeta({ layout: 'admin' })

const { loading } = usePageLoad()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('edu_auth_token')
const { profile, fetchSchoolProfileById } = useAdminAuth()

type SchoolModel = {
  id: string
  name: string
  logo_url: string | null
  theme_color: string | null
  address: string
  description: string | null
}

type SchoolResponse = {
  data: SchoolModel
}

type AcademicYearModel = {
  id: string
  year: string
  term: string
  is_current: boolean
  is_active: boolean
  start_date: string
  end_date: string
}

type AcademicYearResponse = {
  data: AcademicYearModel[]
}

type SubjectModel = {
  id: string
  school_id: string
  category: string | null
  credits: number | null
}

type SubjectResponse = {
  data: SubjectModel[]
}

const schoolError = ref('')
const schoolLoading = ref(false)
const yearError = ref('')
const yearLoading = ref(false)
const curriculumError = ref('')
const curriculumLoading = ref(false)

// ── School form ──
const editingSchool = ref(false)
const schoolForm = reactive({ name: '', logoUrl: '', themeColor: '', address: '', description: '' })
let schoolSnapshot = { ...schoolForm }

function authHeaders() {
  return { Authorization: `Bearer ${authToken.value}` }
}

function bindSchoolForm(school: SchoolModel) {
  schoolForm.name = school.name || ''
  schoolForm.logoUrl = school.logo_url || ''
  schoolForm.themeColor = school.theme_color || ''
  schoolForm.address = school.address || ''
  schoolForm.description = school.description || ''
}

async function loadSchool() {
  if (!import.meta.client) return

  const schoolId = profile.value.schoolId
  if (!schoolId || !authToken.value) return

  schoolLoading.value = true
  schoolError.value = ''

  try {
    const res = await $fetch<SchoolResponse>(`${config.public.apiBase}/back-office/schools/${schoolId}`, {
      headers: authHeaders(),
    })
    bindSchoolForm(res.data)
    schoolSnapshot = { ...schoolForm }
    await fetchSchoolProfileById(schoolId)
  }
  catch {
    try {
      const res = await $fetch<SchoolResponse>(`${config.public.apiBase}/schools/${schoolId}`, {
        headers: authHeaders(),
      })
      bindSchoolForm(res.data)
      schoolSnapshot = { ...schoolForm }
      await fetchSchoolProfileById(schoolId)
    }
    catch {
      schoolError.value = 'ไม่สามารถโหลดข้อมูลโรงเรียนจากระบบได้'
    }
  }
  finally {
    schoolLoading.value = false
  }
}

watch(() => profile.value.schoolId, () => {
  loadSchool()
  loadAcademicYears()
  loadCurriculum()
}, { immediate: true })

function startEditSchool() {
  schoolSnapshot = { ...schoolForm }
  editingSchool.value = true
}
function cancelEditSchool() {
  Object.assign(schoolForm, schoolSnapshot)
  editingSchool.value = false
}
function saveSchool() {
  const schoolId = profile.value.schoolId
  if (!schoolId) {
    schoolError.value = 'ไม่พบ school_id ใน session'
    return
  }

  schoolError.value = ''

  $fetch<SchoolResponse>(`${config.public.apiBase}/back-office/schools/${schoolId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: {
      name: schoolForm.name.trim(),
      logo_url: schoolForm.logoUrl.trim() || null,
      theme_color: schoolForm.themeColor.trim() || null,
      address: schoolForm.address.trim(),
      description: schoolForm.description.trim() || null,
    },
  }).then(async (res) => {
    bindSchoolForm(res.data)
    schoolSnapshot = { ...schoolForm }
    editingSchool.value = false
    await fetchSchoolProfileById(schoolId)
  }).catch(async () => {
    // fallback route for non-back-office mounts
    try {
      const res = await $fetch<SchoolResponse>(`${config.public.apiBase}/schools/${schoolId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: {
          name: schoolForm.name.trim(),
          logo_url: schoolForm.logoUrl.trim() || null,
          theme_color: schoolForm.themeColor.trim() || null,
          address: schoolForm.address.trim(),
          description: schoolForm.description.trim() || null,
        },
      })
      bindSchoolForm(res.data)
      schoolSnapshot = { ...schoolForm }
      editingSchool.value = false
      await fetchSchoolProfileById(schoolId)
    }
    catch {
      schoolError.value = 'บันทึกข้อมูลโรงเรียนไม่สำเร็จ'
    }
  })
}

// ── Year form ──
const editingYear = ref(false)
const yearForm = reactive({ year: '', semester: '', start: '', end: '' })
let yearSnapshot = { ...yearForm }
const academicYears = ref<AcademicYearModel[]>([])
const currentAcademicYearId = ref('')

const academicYearOptions = computed(() => {
  const values = new Set(academicYears.value.map(item => item.year).filter(Boolean))
  return Array.from(values).sort((a, b) => Number(b) - Number(a))
})

const semesterOptions = computed(() => {
  const values = new Set(
    academicYears.value
      .filter(item => !yearForm.year || item.year === yearForm.year)
      .map(item => item.term)
      .filter(Boolean),
  )
  return Array.from(values).sort((a, b) => Number(a) - Number(b))
})

function bindAcademicYearForm(item: AcademicYearModel) {
  currentAcademicYearId.value = item.id
  yearForm.year = item.year
  yearForm.semester = item.term
  yearForm.start = item.start_date
  yearForm.end = item.end_date
}

function formatDateThaiDisplay(isoDate: string) {
  if (!isoDate) return '-'
  const [year, month, day] = isoDate.split('-')
  if (!year || !month || !day) return isoDate
  const buddhistYear = Number(year) + 543
  const dd = day.padStart(2, '0')
  const mm = month.padStart(2, '0')
  return `${dd}/${mm}/${buddhistYear}`
}

async function loadAcademicYears() {
  if (!import.meta.client || !authToken.value) return

  yearLoading.value = true
  yearError.value = ''

  try {
    const res = await $fetch<AcademicYearResponse>(`${config.public.apiBase}/back-office/academic-years`, {
      headers: authHeaders(),
    })

    academicYears.value = res.data || []
  }
  catch {
    try {
      const res = await $fetch<AcademicYearResponse>(`${config.public.apiBase}/academic-years`, {
        headers: authHeaders(),
      })
      academicYears.value = res.data || []
    }
    catch {
      yearError.value = 'ไม่สามารถโหลดข้อมูลปีการศึกษาได้'
      academicYears.value = []
    }
  }
  finally {
    const current = academicYears.value.find(item => item.is_current) || academicYears.value[0]
    if (current) {
      bindAcademicYearForm(current)
      yearSnapshot = { ...yearForm }
    }
    yearLoading.value = false
  }
}

watch(() => [yearForm.year, yearForm.semester], () => {
  if (!editingYear.value) return
  const match = academicYears.value.find(item => item.year === yearForm.year && item.term === yearForm.semester)
  if (!match) return
  currentAcademicYearId.value = match.id
  yearForm.start = match.start_date
  yearForm.end = match.end_date
})

function startEditYear() {
  yearSnapshot = { ...yearForm }
  editingYear.value = true
}
function cancelEditYear() {
  Object.assign(yearForm, yearSnapshot)
  editingYear.value = false
}
async function saveYear() {
  if (!authToken.value) return

  yearError.value = ''

  const payload = {
    year: yearForm.year.trim(),
    term: yearForm.semester.trim(),
    is_current: true,
    is_active: true,
    start_date: yearForm.start,
    end_date: yearForm.end,
  }

  if (!payload.year || !payload.term || !payload.start_date || !payload.end_date) {
    yearError.value = 'กรุณากรอกข้อมูลปีการศึกษาให้ครบ'
    return
  }

  const matched = academicYears.value.find(item => item.year === payload.year && item.term === payload.term)
  const targetId = matched?.id || ''

  try {
    if (targetId) {
      await $fetch(`${config.public.apiBase}/back-office/academic-years/${targetId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: payload,
      })
    }
    else {
      await $fetch(`${config.public.apiBase}/back-office/academic-years`, {
        method: 'POST',
        headers: authHeaders(),
        body: payload,
      })
    }
  }
  catch {
    try {
      if (targetId) {
        await $fetch(`${config.public.apiBase}/academic-years/${targetId}`, {
          method: 'PATCH',
          headers: authHeaders(),
          body: payload,
        })
      }
      else {
        await $fetch(`${config.public.apiBase}/academic-years`, {
          method: 'POST',
          headers: authHeaders(),
          body: payload,
        })
      }
    }
    catch {
      yearError.value = 'บันทึกปีการศึกษาไม่สำเร็จ'
      return
    }
  }

  await loadAcademicYears()
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

const curriculumRows = ref<CurriculumRow[]>([])

function normalizeGroupName(value: string | null | undefined) {
  const text = (value || '').trim()
  return text || 'ไม่ระบุกลุ่มสาระ'
}

function toCurriculumRows(subjects: SubjectModel[]): CurriculumRow[] {
  const grouped = new Map<string, { subjects: number; credit: number }>()
  for (const item of subjects) {
    const key = normalizeGroupName(item.category)
    const current = grouped.get(key) || { subjects: 0, credit: 0 }
    current.subjects += 1
    current.credit += Number(item.credits || 0)
    grouped.set(key, current)
  }

  return Array.from(grouped.entries())
    .map(([group, stat]) => ({
      group,
      subjects: stat.subjects,
      hours: 0,
      credit: Number(stat.credit.toFixed(2)),
    }))
    .sort((a, b) => a.group.localeCompare(b.group, 'th'))
}

async function loadCurriculum() {
  if (!import.meta.client || !authToken.value) return

  const schoolId = profile.value.schoolId
  if (!schoolId) return

  curriculumLoading.value = true
  curriculumError.value = ''

  try {
    const res = await $fetch<SubjectResponse>(`${config.public.apiBase}/back-office/subjects?school_id=${schoolId}`, {
      headers: authHeaders(),
    })
    curriculumRows.value = toCurriculumRows(res.data || [])
  }
  catch {
    try {
      const res = await $fetch<SubjectResponse>(`${config.public.apiBase}/subjects?school_id=${schoolId}`, {
        headers: authHeaders(),
      })
      curriculumRows.value = toCurriculumRows(res.data || [])
    }
    catch {
      curriculumError.value = 'ไม่สามารถโหลดโครงสร้างหลักสูตรได้'
      curriculumRows.value = []
    }
  }
  finally {
    curriculumLoading.value = false
  }
}

function refreshCurriculum() {
  loadCurriculum()
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

.page-loading {
  margin-top: 6px;
  color: #1d4ed8;
  font-size: 13px;
}

.page-error {
  margin-top: 6px;
  color: #dc2626;
  font-size: 13px;
}

.inline-loading {
  margin: 0;
  color: #1d4ed8;
  font-size: 0.82rem;
}

.inline-error {
  margin: 0;
  color: #dc2626;
  font-size: 0.82rem;
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
  flex-wrap: nowrap;
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
