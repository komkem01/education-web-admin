<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading" :rows="5" :cols="6" />
    <template v-else>
      <div class="page-header">
        <div>
          <h2 class="page-title">ครู</h2>
          <p class="page-desc">จัดการข้อมูลครูผู้สอนทั้งหมดในโรงเรียน</p>
          <p v-if="errorMessage" class="inline-error">{{ errorMessage }}</p>
          <p v-if="pageLoading" class="inline-loading">กำลังโหลดข้อมูลครู...</p>
        </div>
        <button type="button" class="btn btn-primary" @click="openAdd">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          เพิ่มครู
        </button>
      </div>

      <div class="filter-row">
        <select v-model="filterTeacherId" class="filter-select">
          <option value="">ครูทั้งหมด</option>
          <option v-for="r in rows" :key="r.teacherId" :value="r.teacherId">{{ r.id }} - {{ r.name }}</option>
        </select>

        <select v-model="filterSubject" class="filter-select">
          <option value="">กลุ่มสาระทั้งหมด</option>
          <option v-for="opt in filterSubjectOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>

        <button v-if="filterTeacherId || filterSubject" type="button" class="btn btn-clear" @click="clearFilters">ล้างตัวกรอง</button>
      </div>

      <AdminDataTable title="รายชื่อครู" :columns="cols" :rows="filteredRows">
        <template #cell-subject="{ value }">
          {{ (value as string) || '-' }}
        </template>
        <template #cell-status="{ value }">
          <AdminStatusBadge :label="value as string" :variant="value === 'อนุมัติแล้ว' ? 'approved' : 'default'" />
        </template>
        <template #rowActions="{ row }">
          <div class="action-btns">
            <button type="button" class="btn btn-sm btn-detail" @click="openDetail(row as unknown as TeacherRow)">รายละเอียด</button>
            <button type="button" class="btn btn-sm btn-edit" @click="openEdit(row as unknown as TeacherRow)">แก้ไข</button>
            <button type="button" class="btn btn-sm btn-delete" @click="openDelete(row as unknown as TeacherRow)">ลบ</button>
          </div>
        </template>
      </AdminDataTable>

      <AdminAppModal v-model="showModal" :title="editTarget ? 'แก้ไขข้อมูลครู' : 'เพิ่มครูใหม่'" size="md" confirm-label="บันทึก" @confirm="saveRow">
        <div class="tab-bar tab-bar--sm">
          <button v-for="t in formTabs" :key="t.key" type="button" class="tab-btn" :class="{ 'tab-btn--active': activeFormTab === t.key }" @click="activeFormTab = t.key">{{ t.label }}</button>
        </div>

        <div v-show="activeFormTab === 'general'" class="form-grid">
          <label class="field">
            <span>รหัสครู</span>
            <input v-if="!editTarget" v-model="form.id" class="input" type="text" placeholder="ปล่อยว่างให้ระบบสร้างอัตโนมัติ" />
            <div v-else class="id-display">
              <span class="id-badge">{{ form.id }}</span>
              <span class="id-hint">รหัสไม่สามารถแก้ไขได้</span>
            </div>
          </label>

          <label v-if="!editTarget" class="field">
            <span>อีเมลผู้ใช้งาน <span class="req">*</span></span>
            <input v-model="form.email" class="input" type="email" placeholder="teacher@school.ac.th" />
            <span v-if="formErrors.email" class="field-error">{{ formErrors.email }}</span>
          </label>

          <label v-if="!editTarget" class="field">
            <span>รหัสผ่าน <span class="req">*</span></span>
            <input v-model="form.password" class="input" type="password" placeholder="อย่างน้อย 6 ตัวอักษร" />
            <span v-if="formErrors.password" class="field-error">{{ formErrors.password }}</span>
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
            <span>กลุ่มสาระ/ฝ่ายงาน</span>
            <AdminSearchSelect
              v-model="form.subject"
              :options="subjectOptions"
              placeholder="เลือกจากข้อมูลที่มี"
              :disabled="subjectOptions.length === 0"
            />
            <span v-if="subjectOptions.length === 0" class="field-hint">ยังไม่มีกลุ่มสาระ/ฝ่ายงานในข้อมูลครู</span>
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

          <div class="field field--full">
            <div class="address-header">
              <span>ที่อยู่</span>
              <button type="button" class="btn btn-add-address" @click="addAddress">+ เพิ่มที่อยู่</button>
            </div>
            <div v-if="form.addresses.length === 0" class="field-hint">ยังไม่มีที่อยู่</div>
            <div v-for="(addr, idx) in form.addresses" :key="`addr-${idx}`" class="address-card">
              <div class="address-card-top">
                <span class="address-no">ที่อยู่ {{ idx + 1 }}</span>
                <button type="button" class="btn-remove-address" @click="removeAddress(idx)">ลบ</button>
              </div>
              <div class="form-grid">
                <label class="field">
                  <span>ป้ายกำกับ</span>
                  <input v-model="addr.label" class="input" type="text" placeholder="เช่น บ้าน, หอพัก" />
                </label>
                <label class="field">
                  <span>ที่อยู่นี้เป็นหลัก</span>
                  <input v-model="addr.isPrimary" type="checkbox" class="address-checkbox" />
                </label>
                <label class="field field--full">
                  <span>รายละเอียดที่อยู่</span>
                  <textarea v-model="addr.addressLine" class="input textarea" rows="2" placeholder="กรอกที่อยู่"></textarea>
                </label>
              </div>
            </div>
          </div>
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
        :description="`ต้องการลบครู '${deleteTarget?.name}' ออกจากระบบหรือไม่?`"
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
  addresses: MemberAddressItem[] | null
  is_active: boolean
}

type MemberAddressItem = {
  id: string
  member_id: string
  label: string | null
  address_line: string
  is_primary: boolean
  sort_order: number
}

type AddressRecord = {
  id?: string
  label: string
  addressLine: string
  isPrimary: boolean
  sortOrder: number
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

type SubjectGroupItem = {
  id: string
  school_id: string
  code: string
  name: string
  head_teacher: string | null
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

type MemberItem = {
  id: string
  school_id: string
  email: string
  role: string
  is_active: boolean
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

type TeacherRow = {
  teacherId: string
  memberId: string
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
  courses: number
  status: string
  email: string
  idCard: string
  phone: string
  currentAcademicStanding: string
  startDate: string
  addresses: AddressRecord[]
  education: EducationRecord[]
  workHistory: WorkRecord[]
}

const { loading } = usePageLoad()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('edu_auth_token')
const { profile } = useAdminAuth()

const cols = [
  { key: 'id', label: 'รหัสครู' },
  { key: 'name', label: 'ชื่อ-นามสกุล' },
  { key: 'subject', label: 'กลุ่มสาระ' },
  { key: 'class', label: 'ตำแหน่ง' },
  { key: 'courses', label: 'วิชาที่สอน' },
  { key: 'status', label: 'สถานะบัญชี' },
]

const rows = ref<TeacherRow[]>([])
const pageLoading = ref(false)
const errorMessage = ref('')
const genderRows = ref<GenderItem[]>([])
const prefixRows = ref<PrefixItem[]>([])
const subjectGroupRows = ref<SubjectGroupItem[]>([])

const filterTeacherId = ref('')
const filterSubject = ref('')

const formTabs = [
  { key: 'general', label: 'ข้อมูลทั่วไป' },
  { key: 'education', label: 'ประวัติการศึกษา' },
  { key: 'work', label: 'ประวัติการทำงาน' },
]
const activeFormTab = ref('general')

const showModal = ref(false)
const editTarget = ref<TeacherRow | null>(null)

const emptyForm = (): TeacherRow & { email: string, password: string } => ({
  teacherId: '',
  memberId: '',
  genderId: '',
  prefixId: '',
  gender: '',
  prefix: '',
  firstName: '',
  lastName: '',
  id: '',
  name: '',
  subject: '',
  class: '',
  courses: 0,
  status: 'อนุมัติแล้ว',
  email: '',
  password: '',
  idCard: '',
  phone: '',
  currentAcademicStanding: '',
  startDate: '',
  addresses: [],
  education: [],
  workHistory: [],
})
const form = ref(emptyForm())
const formErrors = ref({ firstName: '', lastName: '', email: '', password: '' })

const showConfirm = ref(false)
const deleteTarget = ref<TeacherRow | null>(null)

const subjectOptions = computed(() =>
  subjectGroupRows.value
    .filter(item => item.is_active)
    .map(item => ({ label: item.name, value: item.name })),
)
const filterSubjectOptions = computed(() => subjectOptions.value)
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

const filteredRows = computed(() => rows.value.filter((r) => {
  const matchTeacher = !filterTeacherId.value || r.teacherId === filterTeacherId.value
  const matchSubject = !filterSubject.value || r.subject === filterSubject.value
  return matchTeacher && matchSubject
}))

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
    startYear: (item.start_date || '').trim(),
    endYear: item.is_current ? '' : ((item.end_date || '').trim()),
    note: (item.description || '').trim(),
  }
}

function mapAddressRecords(items: MemberAddressItem[] | null | undefined): AddressRecord[] {
  if (!Array.isArray(items)) return []
  return items.map((item, index) => ({
    id: item.id,
    label: (item.label || '').trim(),
    addressLine: (item.address_line || '').trim(),
    isPrimary: Boolean(item.is_primary),
    sortOrder: Number.isFinite(item.sort_order) ? item.sort_order : index,
  }))
}

function toAddressPayload(items: AddressRecord[]) {
  return items
    .map((item, index) => ({
      label: item.label.trim() || null,
      address_line: item.addressLine.trim(),
      is_primary: Boolean(item.isPrimary),
      sort_order: Number.isFinite(item.sortOrder) ? item.sortOrder : index,
    }))
    .filter(item => item.address_line.length > 0)
}

async function loadRows() {
  if (!import.meta.client || !authToken.value) return

  pageLoading.value = true
  errorMessage.value = ''

  try {
    const [teachersRes, membersRes, gendersRes, prefixesRes, subjectGroupsRes] = await Promise.all([
      apiFetch<BaseResponse<TeacherApiItem[]>>('/teachers?only_active=false', { headers: authHeaders() }),
      apiFetch<BaseResponse<MemberItem[]>>('/members?role=teacher&only_active=false', { headers: authHeaders() }),
      apiFetch<BaseResponse<GenderItem[]>>('/genders?only_active=true', { headers: authHeaders() }),
      apiFetch<BaseResponse<PrefixItem[]>>('/prefixes?only_active=true', { headers: authHeaders() }),
      apiFetch<BaseResponse<SubjectGroupItem[]>>('/subject-groups?only_active=true', { headers: authHeaders() }),
    ])

    const teachers = Array.isArray(teachersRes.data) ? teachersRes.data : []
    const members = Array.isArray(membersRes.data) ? membersRes.data : []
    genderRows.value = Array.isArray(gendersRes.data) ? gendersRes.data : []
    prefixRows.value = Array.isArray(prefixesRes.data) ? prefixesRes.data : []
    subjectGroupRows.value = Array.isArray(subjectGroupsRes.data) ? subjectGroupsRes.data : []

    const genderNameById = new Map(genderRows.value.map(item => [item.id, item.name] as const))
    const prefixNameById = new Map(prefixRows.value.map(item => [item.id, item.name] as const))

    const emailMap: Record<string, string> = {}
    for (const member of members) emailMap[member.id] = member.email

    rows.value = teachers.map((teacher) => {
      const prefix = (teacher.prefix_id && prefixNameById.get(teacher.prefix_id)) || ''
      const gender = (teacher.gender_id && genderNameById.get(teacher.gender_id)) || ''
      const firstName = (teacher.first_name || '').trim()
      const lastName = (teacher.last_name || '').trim()
      const name = fullName(prefix, firstName, lastName) || emailMap[teacher.member_id] || '-'
      return {
        teacherId: teacher.id,
        memberId: teacher.member_id,
        genderId: teacher.gender_id || '',
        prefixId: teacher.prefix_id || '',
        gender,
        prefix,
        firstName,
        lastName,
        id: (teacher.teacher_code || '').trim() || teacher.id,
        name,
        subject: (teacher.department || '').trim(),
        class: (teacher.current_position || '').trim() || '-',
        courses: 0,
        status: mapStatus(Boolean(teacher.is_active)),
        email: emailMap[teacher.member_id] || '',
        idCard: (teacher.citizen_id || '').trim(),
        phone: (teacher.phone || '').trim(),
        currentAcademicStanding: (teacher.current_academic_standing || '').trim(),
        startDate: (teacher.start_date || '').trim(),
        addresses: mapAddressRecords(teacher.addresses),
        education: [],
        workHistory: [],
      }
    })
  }
  catch {
    errorMessage.value = 'ไม่สามารถโหลดข้อมูลครูได้'
    rows.value = []
    subjectGroupRows.value = []
  }
  finally {
    pageLoading.value = false
  }
}

if (import.meta.client) {
  loadRows()
}

function clearFilters() {
  filterTeacherId.value = ''
  filterSubject.value = ''
}

function openAdd() {
  editTarget.value = null
  form.value = emptyForm()
  formErrors.value = { firstName: '', lastName: '', email: '', password: '' }
  activeFormTab.value = 'general'
  showModal.value = true
}

async function loadTeacherChildren(teacherId: string) {
  const [educationsRes, worksRes] = await Promise.all([
    apiFetch<BaseResponse<TeacherEducationApiItem[]>>(`/teachers/${teacherId}/educations`, { headers: authHeaders() }),
    apiFetch<BaseResponse<TeacherWorkApiItem[]>>(`/teachers/${teacherId}/work-experiences`, { headers: authHeaders() }),
  ])
  const education = (Array.isArray(educationsRes.data) ? educationsRes.data : []).map(mapEducationRow)
  const workHistory = (Array.isArray(worksRes.data) ? worksRes.data : []).map(mapWorkRow)
  return { education, workHistory }
}

async function openEdit(row: TeacherRow) {
  editTarget.value = row
  formErrors.value = { firstName: '', lastName: '', email: '', password: '' }
  activeFormTab.value = 'general'

  try {
    const { education, workHistory } = await loadTeacherChildren(row.teacherId)
    form.value = {
      ...row,
      email: row.email,
      password: '',
      addresses: row.addresses.map((item, index) => ({ ...item, sortOrder: Number.isFinite(item.sortOrder) ? item.sortOrder : index })),
      education,
      workHistory,
    }
  }
  catch {
    form.value = {
      ...row,
      email: row.email,
      password: '',
      addresses: row.addresses.map((item, index) => ({ ...item, sortOrder: Number.isFinite(item.sortOrder) ? item.sortOrder : index })),
      education: [],
      workHistory: [],
    }
  }

  showModal.value = true
}

const emptyEdu = (): EducationRecord => ({ degree: 'ปริญญาตรี', major: '', institution: '', year: '' })
const emptyWork = (): WorkRecord => ({ position: '', organization: '', startYear: '', endYear: '', note: '' })

function addEducation() { form.value.education.push(emptyEdu()) }
function removeEducation(idx: number) { form.value.education.splice(idx, 1) }
function addWork() { form.value.workHistory.push(emptyWork()) }
function removeWork(idx: number) { form.value.workHistory.splice(idx, 1) }
function addAddress() { form.value.addresses.push({ label: '', addressLine: '', isPrimary: form.value.addresses.length === 0, sortOrder: form.value.addresses.length }) }
function removeAddress(idx: number) {
  form.value.addresses.splice(idx, 1)
  form.value.addresses = form.value.addresses.map((item, index) => ({ ...item, sortOrder: index }))
  if (form.value.addresses.length > 0 && !form.value.addresses.some(item => item.isPrimary)) {
    form.value.addresses[0].isPrimary = true
  }
}

function validate() {
  formErrors.value = { firstName: '', lastName: '', email: '', password: '' }
  if (!form.value.firstName.trim()) formErrors.value.firstName = 'กรุณาระบุชื่อ'
  if (!form.value.lastName.trim()) formErrors.value.lastName = 'กรุณาระบุนามสกุล'
  if (!editTarget.value && !form.value.email.trim()) formErrors.value.email = 'กรุณาระบุอีเมล'
  if (!editTarget.value && form.value.password.trim().length < 6) formErrors.value.password = 'รหัสผ่านต้องอย่างน้อย 6 ตัวอักษร'
  return !formErrors.value.firstName && !formErrors.value.lastName && !formErrors.value.email && !formErrors.value.password
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
  if (!validate() || !authToken.value) {
    activeFormTab.value = 'general'
    return
  }

  const schoolId = profile.value.schoolId
  if (!schoolId) {
    errorMessage.value = 'ไม่พบ school_id ใน session'
    return
  }

  try {
    let memberId = form.value.memberId
    let teacherId = form.value.teacherId

    if (!editTarget.value) {
      const memberRes = await apiFetch<BaseResponse<MemberItem>>('/members', {
        method: 'POST',
        headers: authHeaders(),
        body: {
          school_id: schoolId,
          email: form.value.email.trim(),
          password: form.value.password.trim(),
          role: 'teacher',
          is_active: toIsActive(form.value.status),
        },
      })
      memberId = memberRes.data.id
    }

    const teacherPayload = {
      member_id: memberId,
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
      addresses: toAddressPayload(form.value.addresses),
      is_active: toIsActive(form.value.status),
    }

    if (editTarget.value) {
      const teacherRes = await apiFetch<BaseResponse<TeacherApiItem>>(`/teachers/${teacherId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: teacherPayload,
      })
      teacherId = teacherRes.data.id
      await replaceTeacherChildren(teacherId)
    }
    else {
      const teacherRes = await apiFetch<BaseResponse<TeacherApiItem>>('/teachers', {
        method: 'POST',
        headers: authHeaders(),
        body: teacherPayload,
      })
      teacherId = teacherRes.data.id
      await replaceTeacherChildren(teacherId)
    }

    showModal.value = false
    await loadRows()
  }
  catch {
    errorMessage.value = 'บันทึกข้อมูลครูไม่สำเร็จ'
  }
}

function openDetail(row: TeacherRow) {
  navigateTo(`/admin/teachers/${encodeURIComponent(row.teacherId)}`)
}

function openDelete(row: TeacherRow) {
  deleteTarget.value = row
  showConfirm.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value || !authToken.value) {
    showConfirm.value = false
    return
  }

  try {
    await apiFetch(`/teachers/${deleteTarget.value.teacherId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })

    showConfirm.value = false
    deleteTarget.value = null
    await loadRows()
  }
  catch {
    errorMessage.value = 'ลบข้อมูลครูไม่สำเร็จ'
    showConfirm.value = false
  }
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 20px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.page-title { font-size: 1.2rem; font-weight: 700; margin: 0; color: #111827; }
.page-desc { color: #6b7280; margin-top: 4px; font-size: 0.85rem; }
.inline-loading { margin-top: 6px; color: #1d4ed8; font-size: 0.82rem; }
.inline-error { margin-top: 6px; color: #dc2626; font-size: 0.82rem; }
.filter-row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.search-wrap { position: relative; }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); pointer-events: none; }
.input { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 12px; font-size: 0.875rem; font-family: inherit; background: #fff; color: #111827; outline: none; transition: border-color 0.12s; }
.input:focus { border-color: #6366f1; }
.search { width: 260px; padding-left: 32px; }
.sel { width: 240px; }
.btn { display: inline-flex; align-items: center; gap: 6px; border-radius: 8px; padding: 8px 14px; font-size: 0.875rem; font-weight: 500; border: 1px solid transparent; background: #fff; color: #111827; cursor: pointer; font-family: inherit; }
.btn-primary { background: #111827; color: #fff; border-color: #111827; }
.btn-primary:hover { background: #1f2937; }
.btn-clear { border: 1px solid #e5e7eb; background: #fff; color: #6b7280; font-size: 0.8rem; padding: 7px 12px; white-space: nowrap; border-radius: 8px; font-weight: 500; }
.btn-clear:hover { background: #f9fafb; color: #374151; }
.action-btns { display: flex; gap: 6px; justify-content: flex-end; flex-wrap: nowrap; }
.btn-sm { padding: 5px 10px; font-size: 0.8rem; }
.btn-detail { border-color: #e5e7eb; background: #fff; color: #374151; }
.btn-detail:hover { background: #f9fafb; }
.btn-edit { border-color: #bfdbfe; background: #eff6ff; color: #1d4ed8; }
.btn-edit:hover { background: #dbeafe; border-color: #93c5fd; }
.btn-delete { border-color: #fecaca; background: #fff5f5; color: #dc2626; }
.btn-delete:hover { background: #fee2e2; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 5px; font-size: 0.83rem; font-weight: 500; color: #374151; }
.field--full { grid-column: 1 / -1; }
.req { color: #ef4444; }
.field-error { font-size: 0.75rem; color: #ef4444; margin-top: 2px; }
.field-hint { font-size: 0.75rem; color: #6b7280; margin-top: 2px; }
.textarea { resize: vertical; min-height: 62px; }
.address-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.address-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px; background: #fafafa; margin-top: 8px; }
.address-card-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
.address-no { font-size: 0.78rem; font-weight: 600; color: #6b7280; }
.btn-add-address { border-color: #d1d5db; background: #fff; color: #374151; padding: 4px 10px; font-size: 0.75rem; }
.btn-add-address:hover { background: #f9fafb; }
.btn-remove-address { font-size: 0.75rem; padding: 3px 8px; border-radius: 6px; border: 1px solid #fecaca; background: #fef2f2; color: #b91c1c; cursor: pointer; }
.btn-remove-address:hover { background: #fee2e2; }
.address-checkbox { width: 18px; height: 18px; accent-color: #2563eb; margin-top: 4px; }
.id-display { display: flex; align-items: center; gap: 8px; padding: 7px 10px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; }
.id-badge { font-size: 0.875rem; font-weight: 600; color: #374151; font-family: monospace; letter-spacing: 0.05em; }
.id-hint { font-size: 0.75rem; color: #9ca3af; }
.tab-bar { display: flex; gap: 2px; border-bottom: 2px solid #e5e7eb; margin-bottom: 20px; }
.tab-bar--sm { margin-bottom: 16px; }
.tab-btn { padding: 8px 16px; font-size: 0.875rem; font-weight: 500; color: #6b7280; background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; cursor: pointer; transition: color 0.12s, border-color 0.12s; }
.tab-btn:hover { color: #374151; }
.tab-btn--active { color: #4f46e5; border-bottom-color: #4f46e5; }
.history-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; margin-bottom: 12px; background: #fafafa; }
.history-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.history-card-no { font-size: 0.8rem; font-weight: 600; color: #6b7280; }
.btn-remove { font-size: 0.75rem; padding: 3px 8px; border-radius: 6px; border: 1px solid #fecaca; background: #fef2f2; color: #b91c1c; cursor: pointer; }
.btn-remove:hover { background: #fee2e2; }
.btn-add-history { width: 100%; padding: 9px; border: 1px dashed #d1d5db; border-radius: 8px; background: #f9fafb; color: #6b7280; font-size: 0.875rem; cursor: pointer; transition: all 0.12s; }
.btn-add-history:hover { border-color: #6366f1; color: #4f46e5; background: #eef2ff; }
</style>
