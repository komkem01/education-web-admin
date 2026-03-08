<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading || pageLoading" :rows="5" :cols="2" />
    <template v-else>
      <div v-if="!record" class="not-found">
        <p class="not-found-text">ไม่พบข้อมูลครู</p>
        <button class="btn btn-primary" @click="navigateTo('/admin/teachers')">กลับรายการ</button>
      </div>

      <template v-else>
        <div class="page-header">
          <div class="header-left">
            <button class="btn btn-back" @click="navigateTo('/admin/teachers')">กลับ</button>
            <div>
              <h2 class="page-title">{{ record.name }}</h2>
              <p class="page-desc">{{ record.subject }} · รหัส {{ record.id }}</p>
              <p v-if="errorMessage" class="inline-error">{{ errorMessage }}</p>
            </div>
          </div>
          <div class="header-actions">
            <AdminStatusBadge :label="record.status" :variant="record.status === 'อนุมัติแล้ว' ? 'approved' : 'default'" />
            <button class="btn btn-edit" @click="openEdit">แก้ไข</button>
            <button class="btn btn-delete" @click="showConfirm = true">ลบ</button>
          </div>
        </div>

        <div class="tab-bar">
          <button v-for="t in tabs" :key="t.key" type="button" class="tab-btn" :class="{ 'tab-btn--active': activeTab === t.key }" @click="activeTab = t.key">
            {{ t.label }}
          </button>
        </div>

        <div v-show="activeTab === 'general'">
          <div class="detail-card">
            <p class="section-title">ข้อมูลระบบ</p>
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">รหัสครู</span><span class="detail-value mono">{{ record.id }}</span></div>
              <div class="detail-item"><span class="detail-label">สถานะบัญชี</span><span class="detail-value"><AdminStatusBadge :label="record.status" :variant="record.status === 'อนุมัติแล้ว' ? 'approved' : 'default'" /></span></div>
              <div class="detail-item"><span class="detail-label">อีเมล</span><span class="detail-value">{{ record.email || '-' }}</span></div>
              <div class="detail-item"><span class="detail-label">กลุ่มสาระ</span><span class="detail-value">{{ record.subject }}</span></div>
              <div class="detail-item"><span class="detail-label">ตำแหน่งปัจจุบัน</span><span class="detail-value">{{ record.class || '-' }}</span></div>
              <div class="detail-item"><span class="detail-label">วิทยฐานะ</span><span class="detail-value">{{ record.currentAcademicStanding || '-' }}</span></div>
              <div class="detail-item"><span class="detail-label">วันเริ่มงาน</span><span class="detail-value">{{ formatDisplayDate(record.startDate) }}</span></div>
            </div>
          </div>
          <div class="detail-card" style="margin-top: 16px;">
            <p class="section-title">ข้อมูลส่วนตัว</p>
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">เพศ</span><span class="detail-value">{{ record.gender || '-' }}</span></div>
              <div class="detail-item"><span class="detail-label">คำนำหน้า</span><span class="detail-value">{{ record.prefix || '-' }}</span></div>
              <div class="detail-item"><span class="detail-label">ชื่อ</span><span class="detail-value">{{ record.firstName || '-' }}</span></div>
              <div class="detail-item"><span class="detail-label">นามสกุล</span><span class="detail-value">{{ record.lastName || '-' }}</span></div>
              <div class="detail-item"><span class="detail-label">เลขบัตรประชาชน</span><span class="detail-value mono">{{ record.idCard || '-' }}</span></div>
              <div class="detail-item"><span class="detail-label">เบอร์โทรศัพท์</span><span class="detail-value">{{ record.phone || '-' }}</span></div>
            </div>
          </div>
        </div>

        <div v-show="activeTab === 'education'">
          <div class="detail-card">
            <p class="section-title">ประวัติการศึกษา</p>
            <div v-if="record.education.length === 0" class="empty-state">ยังไม่มีข้อมูลประวัติการศึกษา</div>
            <div v-for="(edu, idx) in record.education" :key="idx" class="history-view-card">
              <div class="hvc-degree">{{ edu.degree }}</div>
              <div class="hvc-major">{{ edu.major }}</div>
              <div class="hvc-row">
                <span class="hvc-inst">{{ edu.institution }}</span>
                <span class="hvc-meta" v-if="edu.year">ปี {{ edu.year }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-show="activeTab === 'work'">
          <div class="detail-card">
            <p class="section-title">ประวัติการทำงาน</p>
            <div v-if="record.workHistory.length === 0" class="empty-state">ยังไม่มีข้อมูลประวัติการทำงาน</div>
            <div v-for="(work, idx) in record.workHistory" :key="idx" class="history-view-card">
              <div class="hvc-degree">{{ work.position }}</div>
              <div class="hvc-major">{{ work.organization }}</div>
              <div class="hvc-row">
                <span class="hvc-meta">{{ formatWorkRange(work.startYear, work.endYear) }}</span>
                <span v-if="work.note" class="hvc-note">{{ work.note }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <AdminAppModal v-model="showModal" title="แก้ไขข้อมูลครู" size="md" confirm-label="บันทึก" @confirm="saveRow">
        <div class="tab-bar tab-bar--sm">
          <button v-for="t in formTabs" :key="t.key" type="button" class="tab-btn" :class="{ 'tab-btn--active': activeFormTab === t.key }" @click="activeFormTab = t.key">{{ t.label }}</button>
        </div>

        <div v-show="activeFormTab === 'general'" class="form-grid">
          <label class="field">
            <span>รหัสครู</span>
            <div class="id-display"><span class="id-badge">{{ form.id }}</span><span class="id-hint">รหัสไม่สามารถแก้ไขได้</span></div>
          </label>
          <label class="field">
            <span>เพศ</span>
            <AdminSearchSelect v-model="form.genderId" :options="genderOptions" placeholder="เลือกเพศ" />
          </label>
          <label class="field">
            <span>คำนำหน้า</span>
            <AdminSearchSelect v-model="form.prefixId" :options="prefixOptions" placeholder="เลือกคำนำหน้า" />
          </label>
          <label class="field">
            <span>ชื่อ <span class="req">*</span></span>
            <input v-model="form.firstName" class="input" type="text" placeholder="ชื่อ" />
            <span v-if="formErrors.firstName" class="field-error">{{ formErrors.firstName }}</span>
          </label>
          <label class="field">
            <span>นามสกุล <span class="req">*</span></span>
            <input v-model="form.lastName" class="input" type="text" placeholder="นามสกุล" />
            <span v-if="formErrors.lastName" class="field-error">{{ formErrors.lastName }}</span>
          </label>
          <label class="field">
            <span>กลุ่มสาระ</span>
            <AdminSearchSelect v-model="form.subject" :options="subjectOptions" placeholder="เลือกกลุ่มสาระ" />
          </label>
          <label class="field">
            <span>ตำแหน่งปัจจุบัน</span>
            <input v-model="form.class" class="input" type="text" placeholder="เช่น ครูประจำชั้น ม.1/1" />
          </label>
          <label class="field">
            <span>วิทยฐานะปัจจุบัน</span>
            <input v-model="form.currentAcademicStanding" class="input" type="text" placeholder="เช่น ชำนาญการ" />
          </label>
          <label class="field">
            <span>เลขบัตรประชาชน</span>
            <input v-model="form.idCard" class="input" type="text" placeholder="13 หลัก" />
          </label>
          <label class="field">
            <span>เบอร์โทรศัพท์</span>
            <input v-model="form.phone" class="input" type="text" placeholder="08x-xxx-xxxx" />
          </label>
          <label class="field">
            <span>วันเริ่มงาน</span>
            <input v-model="form.startDate" class="input" type="date" />
          </label>
          <label class="field">
            <span>สถานะบัญชี</span>
            <AdminSearchSelect v-model="form.status" :options="statusOptions" placeholder="เลือกสถานะบัญชี" :searchable="false" />
          </label>
        </div>

        <div v-show="activeFormTab === 'education'">
          <div v-for="(edu, idx) in form.education" :key="idx" class="history-card">
            <div class="history-card-header">
              <span class="history-card-no">ที่ {{ idx + 1 }}</span>
              <button type="button" class="btn-remove" @click="removeEducation(idx)">ลบ</button>
            </div>
            <div class="form-grid">
              <label class="field">
                <span>วุฒิการศึกษา</span>
                <AdminSearchSelect v-model="edu.degree" :options="degreeOptions" placeholder="เลือกวุฒิการศึกษา" :searchable="false" />
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
                <input v-model="edu.year" class="input" type="text" placeholder="2566" />
              </label>
            </div>
          </div>
          <button type="button" class="btn-add-history" @click="addEducation">+ เพิ่มประวัติการศึกษา</button>
        </div>

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
                <span>วันเริ่มงาน</span>
                <input v-model="work.startYear" class="input" type="date" />
              </label>
              <label class="field">
                <span>วันสิ้นสุด</span>
                <input v-model="work.endYear" class="input" type="date" />
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

      <AdminAppConfirmModal
        v-model="showConfirm"
        :description="`ต้องการลบครู '${record?.name}' ออกจากระบบหรือไม่?`"
        @confirm="confirmDelete"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

definePageMeta({ layout: 'admin' })

type BaseResponse<T> = { data: T }

type TeacherApiItem = {
  id: string
  member_id: string
  gender_id: string | null
  prefix_id: string | null
  teacher_code: string | null
  first_name: string | null
  last_name: string | null
  citizen_id: string | null
  phone: string | null
  current_position: string | null
  current_academic_standing: string | null
  department: string | null
  start_date: string | null
  is_active: boolean
}

type MemberItem = {
  id: string
  school_id: string
  email: string
  role: string
  is_active: boolean
}

type GenderItem = {
  id: string
  name: string
  is_active: boolean
}

type PrefixItem = {
  id: string
  gender_id: string | null
  name: string
  is_active: boolean
}

type TeacherEducationApiItem = {
  id: string
  teacher_id: string
  degree_level: string | null
  degree_name: string | null
  major: string | null
  university: string | null
  graduation_year: string | null
}

type TeacherWorkApiItem = {
  id: string
  teacher_id: string
  organization: string | null
  position: string | null
  start_date: string | null
  end_date: string | null
  is_current: boolean
  description: string | null
}

type EducationRecord = {
  id?: string
  degree: string
  major: string
  institution: string
  year: string
}

type WorkRecord = {
  id?: string
  position: string
  organization: string
  startYear: string
  endYear: string
  note: string
}

type TeacherRecord = {
  teacherId: string
  memberId: string
  email: string
  genderId: string
  prefixId: string
  gender: string
  prefix: string
  firstName: string
  lastName: string
  id: string
  name: string
  subject: string
  class: string
  status: string
  idCard: string
  phone: string
  currentAcademicStanding: string
  startDate: string
  education: EducationRecord[]
  workHistory: WorkRecord[]
}

const { loading } = usePageLoad()
const route = useRoute()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('edu_auth_token')

const id = computed(() => decodeURIComponent(String(route.params.id ?? '')))
const pageLoading = ref(false)
const errorMessage = ref('')
const record = ref<TeacherRecord | null>(null)
const genderRows = ref<GenderItem[]>([])
const prefixRows = ref<PrefixItem[]>([])

const subjects = ['ภาษาไทย', 'คณิตศาสตร์', 'วิทยาศาสตร์', 'สังคมศึกษา', 'ภาษาต่างประเทศ', 'ศิลปะ', 'พลศึกษา']
const subjectOptions = subjects.map(value => ({ label: value, value }))
const statusOptions = [
  { label: 'อนุมัติแล้ว', value: 'อนุมัติแล้ว' },
  { label: 'ระงับ', value: 'ระงับ' },
]
const degreeOptions = [
  { label: 'ปริญญาตรี', value: 'ปริญญาตรี' },
  { label: 'ปริญญาโท', value: 'ปริญญาโท' },
  { label: 'ปริญญาเอก', value: 'ปริญญาเอก' },
  { label: 'อื่น ๆ', value: 'อื่น ๆ' },
]

const tabs = [
  { key: 'general', label: 'ข้อมูลทั่วไป' },
  { key: 'education', label: 'ประวัติการศึกษา' },
  { key: 'work', label: 'ประวัติการทำงาน' },
]
const activeTab = ref('general')

const showModal = ref(false)
const showConfirm = ref(false)
const activeFormTab = ref('general')
const formTabs = [
  { key: 'general', label: 'ข้อมูลทั่วไป' },
  { key: 'education', label: 'ประวัติการศึกษา' },
  { key: 'work', label: 'ประวัติการทำงาน' },
]

const form = ref<TeacherRecord>({
  teacherId: '',
  memberId: '',
  email: '',
  genderId: '',
  prefixId: '',
  gender: '',
  prefix: '',
  firstName: '',
  lastName: '',
  id: '',
  name: '',
  subject: 'ภาษาไทย',
  class: '',
  status: 'อนุมัติแล้ว',
  idCard: '',
  phone: '',
  currentAcademicStanding: '',
  startDate: '',
  education: [],
  workHistory: [],
})
const formErrors = ref({ firstName: '', lastName: '' })

const genderOptions = computed(() => [
  { label: 'ไม่ระบุเพศ', value: '' },
  ...genderRows.value.map(item => ({ label: item.name, value: item.id })),
])
const prefixOptions = computed(() => {
  const targetGender = form.value.genderId || ''
  const filtered = targetGender
    ? prefixRows.value.filter(item => !item.gender_id || item.gender_id === targetGender)
    : prefixRows.value
  return [
    { label: 'ไม่ระบุคำนำหน้า', value: '' },
    ...filtered.map(item => ({ label: item.name, value: item.id })),
  ]
})

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

function fullName(prefix: string, firstName: string | null, lastName: string | null) {
  const name = `${(firstName || '').trim()} ${(lastName || '').trim()}`.trim()
  if (!prefix) return name
  return `${prefix}${name ? ` ${name}` : ''}`.trim()
}

function mapStatus(isActive: boolean) {
  return isActive ? 'อนุมัติแล้ว' : 'ระงับ'
}

function toIsActive(status: string) {
  return status === 'อนุมัติแล้ว'
}

function toDateOnly(value: string | null | undefined) {
  const text = (value || '').trim()
  if (!text) return ''

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text

  const isoMatch = text.match(/^(\d{4}-\d{2}-\d{2})/)
  if (isoMatch?.[1]) return isoMatch[1]

  const thMatch = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (thMatch) return `${thMatch[3]}-${thMatch[2]}-${thMatch[1]}`

  const parsed = new Date(text)
  if (Number.isNaN(parsed.getTime())) return ''

  const y = String(parsed.getFullYear())
  const m = String(parsed.getMonth() + 1).padStart(2, '0')
  const d = String(parsed.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDisplayDate(value: string | null | undefined) {
  const dateOnly = toDateOnly(value)
  if (!dateOnly) return '-'
  const [y, m, d] = dateOnly.split('-')
  if (!y || !m || !d) return '-'
  const buddhistYear = Number(y) + 543
  return `${d}/${m}/${buddhistYear}`
}

function formatWorkRange(startDate: string, endDate: string) {
  const start = formatDisplayDate(startDate)
  const end = endDate ? formatDisplayDate(endDate) : 'ปัจจุบัน'
  return `${start} - ${end}`
}

function mapEducationRow(item: TeacherEducationApiItem): EducationRecord {
  return {
    id: item.id,
    degree: (item.degree_level || item.degree_name || '').trim() || 'ปริญญาตรี',
    major: (item.major || '').trim(),
    institution: (item.university || '').trim(),
    year: (item.graduation_year || '').trim(),
  }
}

function mapWorkRow(item: TeacherWorkApiItem): WorkRecord {
  return {
    id: item.id,
    position: (item.position || '').trim(),
    organization: (item.organization || '').trim(),
    startYear: toDateOnly(item.start_date),
    endYear: item.is_current ? '' : toDateOnly(item.end_date),
    note: (item.description || '').trim(),
  }
}

async function loadRecord() {
  if (!import.meta.client || !authToken.value || !id.value) return

  pageLoading.value = true
  errorMessage.value = ''

  try {
    const [teacherRes, educationsRes, worksRes, gendersRes, prefixesRes] = await Promise.all([
      apiFetch<BaseResponse<TeacherApiItem>>(`/teachers/${id.value}`, { headers: authHeaders() }),
      apiFetch<BaseResponse<TeacherEducationApiItem[]>>(`/teachers/${id.value}/educations`, { headers: authHeaders() }),
      apiFetch<BaseResponse<TeacherWorkApiItem[]>>(`/teachers/${id.value}/work-experiences`, { headers: authHeaders() }),
      apiFetch<BaseResponse<GenderItem[]>>('/genders?only_active=true', { headers: authHeaders() }),
      apiFetch<BaseResponse<PrefixItem[]>>('/prefixes?only_active=true', { headers: authHeaders() }),
    ])

    genderRows.value = Array.isArray(gendersRes.data) ? gendersRes.data : []
    prefixRows.value = Array.isArray(prefixesRes.data) ? prefixesRes.data : []

    const genderNameById = new Map(genderRows.value.map(item => [item.id, item.name] as const))
    const prefixNameById = new Map(prefixRows.value.map(item => [item.id, item.name] as const))

    const teacher = teacherRes.data
    const memberRes = await apiFetch<BaseResponse<MemberItem>>(`/members/${teacher.member_id}`, { headers: authHeaders() })
    const prefix = (teacher.prefix_id && prefixNameById.get(teacher.prefix_id)) || ''
    const gender = (teacher.gender_id && genderNameById.get(teacher.gender_id)) || ''
    const firstName = (teacher.first_name || '').trim()
    const lastName = (teacher.last_name || '').trim()
    const name = fullName(prefix, firstName, lastName) || '-'

    record.value = {
      teacherId: teacher.id,
      memberId: teacher.member_id,
      email: (memberRes.data?.email || '').trim(),
      genderId: teacher.gender_id || '',
      prefixId: teacher.prefix_id || '',
      gender,
      prefix,
      firstName,
      lastName,
      id: (teacher.teacher_code || '').trim() || teacher.id,
      name,
      subject: (teacher.department || '').trim() || 'ไม่ระบุ',
      class: (teacher.current_position || '').trim(),
      status: mapStatus(Boolean(teacher.is_active)),
      idCard: (teacher.citizen_id || '').trim(),
      phone: (teacher.phone || '').trim(),
      currentAcademicStanding: (teacher.current_academic_standing || '').trim(),
      startDate: toDateOnly(teacher.start_date),
      education: (Array.isArray(educationsRes.data) ? educationsRes.data : []).map(mapEducationRow),
      workHistory: (Array.isArray(worksRes.data) ? worksRes.data : []).map(mapWorkRow),
    }
  }
  catch {
    record.value = null
    errorMessage.value = 'ไม่สามารถโหลดข้อมูลครูได้'
  }
  finally {
    pageLoading.value = false
  }
}

if (import.meta.client) {
  loadRecord()
}

const emptyEdu = (): EducationRecord => ({ degree: 'ปริญญาตรี', major: '', institution: '', year: '' })
const emptyWork = (): WorkRecord => ({ position: '', organization: '', startYear: '', endYear: '', note: '' })

function addEducation() { form.value.education.push(emptyEdu()) }
function removeEducation(idx: number) { form.value.education.splice(idx, 1) }
function addWork() { form.value.workHistory.push(emptyWork()) }
function removeWork(idx: number) { form.value.workHistory.splice(idx, 1) }

function openEdit() {
  if (!record.value) return
  form.value = {
    ...record.value,
    education: record.value.education.map(item => ({ ...item })),
    workHistory: record.value.workHistory.map(item => ({ ...item })),
  }
  formErrors.value = { firstName: '', lastName: '' }
  activeFormTab.value = 'general'
  showModal.value = true
}

function validate() {
  formErrors.value = { firstName: '', lastName: '' }
  if (!form.value.firstName.trim()) formErrors.value.firstName = 'กรุณาระบุชื่อ'
  if (!form.value.lastName.trim()) formErrors.value.lastName = 'กรุณาระบุนามสกุล'
  return !formErrors.value.firstName && !formErrors.value.lastName
}

async function replaceTeacherChildren(teacherId: string) {
  const currentEducationRes = await apiFetch<BaseResponse<TeacherEducationApiItem[]>>(`/teachers/${teacherId}/educations`, { headers: authHeaders() })
  const currentWorkRes = await apiFetch<BaseResponse<TeacherWorkApiItem[]>>(`/teachers/${teacherId}/work-experiences`, { headers: authHeaders() })

  const currentEducation = Array.isArray(currentEducationRes.data) ? currentEducationRes.data : []
  const currentWork = Array.isArray(currentWorkRes.data) ? currentWorkRes.data : []

  await Promise.all(currentEducation.map(item =>
    apiFetch(`/teachers/${teacherId}/educations/${item.id}`, { method: 'DELETE', headers: authHeaders() }).catch(() => {}),
  ))
  await Promise.all(currentWork.map(item =>
    apiFetch(`/teachers/${teacherId}/work-experiences/${item.id}`, { method: 'DELETE', headers: authHeaders() }).catch(() => {}),
  ))

  for (const edu of form.value.education) {
    const degree = edu.degree.trim()
    const major = edu.major.trim()
    const institution = edu.institution.trim()
    const year = edu.year.trim()
    if (!degree && !major && !institution && !year) continue

    await apiFetch(`/teachers/${teacherId}/educations`, {
      method: 'POST',
      headers: authHeaders(),
      body: {
        degree_level: degree || null,
        degree_name: degree || null,
        major: major || null,
        university: institution || null,
        graduation_year: year || null,
      },
    })
  }

  for (const work of form.value.workHistory) {
    const position = work.position.trim()
    const organization = work.organization.trim()
    const startDate = work.startYear.trim()
    const endDate = work.endYear.trim()
    const note = work.note.trim()
    if (!position && !organization && !startDate && !endDate && !note) continue

    await apiFetch(`/teachers/${teacherId}/work-experiences`, {
      method: 'POST',
      headers: authHeaders(),
      body: {
        position: position || null,
        organization: organization || null,
        start_date: startDate || null,
        end_date: endDate || null,
        is_current: !endDate,
        description: note || null,
      },
    })
  }
}

async function saveRow() {
  if (!validate() || !record.value || !authToken.value) return

  try {
    await apiFetch(`/teachers/${record.value.teacherId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: {
        member_id: record.value.memberId,
        gender_id: form.value.genderId || null,
        prefix_id: form.value.prefixId || null,
        teacher_code: form.value.id.trim() || null,
        first_name: form.value.firstName.trim() || null,
        last_name: form.value.lastName.trim() || null,
        citizen_id: form.value.idCard.trim() || null,
        phone: form.value.phone.trim() || null,
        current_position: form.value.class.trim() || null,
        current_academic_standing: form.value.currentAcademicStanding.trim() || null,
        department: form.value.subject.trim() || null,
        start_date: form.value.startDate || null,
        is_active: toIsActive(form.value.status),
      },
    })

    await replaceTeacherChildren(record.value.teacherId)

    showModal.value = false
    await loadRecord()
  }
  catch {
    errorMessage.value = 'บันทึกข้อมูลครูไม่สำเร็จ'
  }
}

async function confirmDelete() {
  if (!record.value || !authToken.value) {
    showConfirm.value = false
    return
  }

  try {
    await apiFetch(`/teachers/${record.value.teacherId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })

    showConfirm.value = false
    navigateTo('/admin/teachers')
  }
  catch {
    errorMessage.value = 'ลบข้อมูลครูไม่สำเร็จ'
    showConfirm.value = false
  }
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 18px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.header-left { display: flex; align-items: flex-start; gap: 12px; }
.header-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.page-title { font-size: 1.3rem; font-weight: 700; margin: 0; color: #111827; }
.page-desc { color: #6b7280; margin-top: 4px; font-size: 0.85rem; }
.inline-error { margin-top: 6px; color: #dc2626; font-size: 0.82rem; }
.btn { display: inline-flex; align-items: center; gap: 5px; border-radius: 8px; padding: 8px 14px; font-size: 0.875rem; font-weight: 500; border: 1px solid #d1d5db; background: #fff; color: #374151; cursor: pointer; font-family: inherit; transition: background 0.12s; }
.btn:hover { background: #f9fafb; }
.btn-back { color: #6b7280; padding: 7px 12px; font-size: 0.82rem; margin-top: 2px; }
.btn-primary { background: #111827; color: #fff; border-color: #111827; }
.btn-edit { border-color: #bfdbfe; background: #eff6ff; color: #1d4ed8; }
.btn-edit:hover { background: #dbeafe; border-color: #93c5fd; }
.btn-delete { border-color: #fecaca; background: #fff5f5; color: #dc2626; }
.btn-delete:hover { background: #fee2e2; }
.tab-bar { display: flex; gap: 2px; border-bottom: 2px solid #e5e7eb; }
.tab-bar--sm { margin-bottom: 16px; }
.tab-btn { padding: 8px 16px; font-size: 0.875rem; font-weight: 500; color: #6b7280; background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; cursor: pointer; transition: color 0.12s, border-color 0.12s; }
.tab-btn:hover { color: #374151; }
.tab-btn--active { color: #4f46e5; border-bottom-color: #4f46e5; }
.detail-card { background: #fff; border: 1px solid #e8eaed; border-radius: 14px; padding: 24px; }
.section-title { font-size: 0.78rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 18px; padding-bottom: 10px; border-bottom: 1px solid #f3f4f6; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px 32px; }
.detail-item { display: flex; flex-direction: column; gap: 5px; }
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
.id-display { display: flex; align-items: center; gap: 8px; padding: 7px 10px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; }
.id-badge { font-size: 0.875rem; font-weight: 600; color: #374151; font-family: monospace; letter-spacing: 0.05em; }
.id-hint { font-size: 0.75rem; color: #9ca3af; }
.history-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; margin-bottom: 12px; background: #fafafa; }
.history-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.history-card-no { font-size: 0.8rem; font-weight: 600; color: #6b7280; }
.btn-remove { font-size: 0.75rem; padding: 3px 8px; border-radius: 6px; border: 1px solid #fecaca; background: #fef2f2; color: #b91c1c; cursor: pointer; }
.btn-remove:hover { background: #fee2e2; }
.btn-add-history { width: 100%; padding: 9px; border: 1px dashed #d1d5db; border-radius: 8px; background: #f9fafb; color: #6b7280; font-size: 0.875rem; cursor: pointer; transition: all 0.12s; }
.btn-add-history:hover { border-color: #6366f1; color: #4f46e5; background: #eef2ff; }
.not-found { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 60px 0; color: #9ca3af; }
.not-found-text { font-size: 1rem; }
</style>
