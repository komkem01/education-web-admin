<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading" :rows="5" :cols="6" />
    <template v-else>
      <div class="page-header">
        <div>
          <h2 class="page-title">นักเรียน</h2>
          <p class="page-desc">จัดการข้อมูลนักเรียนทั้งหมดในโรงเรียน</p>
          <p v-if="errorMessage" class="inline-error">{{ errorMessage }}</p>
          <p v-if="pageLoading" class="inline-loading">กำลังโหลดข้อมูลนักเรียน...</p>
        </div>
        <button type="button" class="btn btn-primary" @click="openAdd">+ เพิ่มนักเรียน</button>
      </div>

      <div class="filter-row">
        <select v-model="filterStudentId" class="filter-select">
          <option value="">นักเรียนทั้งหมด</option>
          <option v-for="r in rows" :key="r.studentId" :value="r.studentId">{{ r.code }} - {{ r.name }}</option>
        </select>

        <select v-model="filterClassroom" class="filter-select">
          <option value="">ห้องเรียนทั้งหมด</option>
          <option v-for="opt in classroomFilterOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>

        <button v-if="filterStudentId || filterClassroom" type="button" class="btn btn-clear" @click="clearFilters">ล้างตัวกรอง</button>
      </div>

      <AdminDataTable title="รายชื่อนักเรียน" :columns="cols" :rows="filteredRows">
        <template #cell-status="{ value }">
          <AdminStatusBadge :label="value as string" :variant="value === 'ปกติ' ? 'approved' : 'default'" />
        </template>
        <template #rowActions="{ row }">
          <div class="action-btns">
            <button type="button" class="btn btn-sm btn-detail" @click="openDetail(row as unknown as StudentRow)">รายละเอียด</button>
            <button type="button" class="btn btn-sm btn-edit" @click="openEdit(row as unknown as StudentRow)">แก้ไข</button>
            <button type="button" class="btn btn-sm btn-delete" @click="openDelete(row as unknown as StudentRow)">ลบ</button>
          </div>
        </template>
      </AdminDataTable>

      <AdminAppModal v-model="showModal" :title="editTarget ? 'แก้ไขข้อมูลนักเรียน' : 'เพิ่มนักเรียนใหม่'" size="md" confirm-label="บันทึก" @confirm="saveRow">
        <div class="form-grid">
          <label class="field">
            <span>รหัสนักเรียน</span>
            <input v-if="!editTarget" v-model="form.code" class="input" type="text" placeholder="ปล่อยว่างให้ระบบสร้างอัตโนมัติ" />
            <div v-else class="id-display">
              <span class="id-badge">{{ form.code || '-' }}</span>
              <span class="id-hint">รหัสไม่สามารถแก้ไขได้</span>
            </div>
          </label>

          <label v-if="!editTarget" class="field">
            <span>อีเมลผู้ใช้งาน <span class="req">*</span></span>
            <input v-model="form.email" class="input" type="email" placeholder="student@school.ac.th" />
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
            <span>ชื่อเล่น</span>
            <input v-model="form.nickName" class="input" type="text" placeholder="ชื่อเล่น" />
            <span v-if="formErrors.nickName" class="field-error">{{ formErrors.nickName }}</span>
          </label>

          <label class="field">
            <span>วันเกิด</span>
            <input v-model="form.dob" class="input" type="date" />
            <span v-if="formErrors.dob" class="field-error">{{ formErrors.dob }}</span>
          </label>

          <label class="field">
            <span>กรุ๊ปเลือด</span>
            <AdminSearchSelect v-model="form.bloodType" :options="bloodTypeOptions" placeholder="เลือกกรุ๊ปเลือด" :searchable="false" />
            <span v-if="formErrors.bloodType" class="field-error">{{ formErrors.bloodType }}</span>
          </label>

          <label class="field">
            <span>ศาสนา</span>
            <input v-model="form.religion" class="input" type="text" placeholder="ศาสนา" />
            <span v-if="formErrors.religion" class="field-error">{{ formErrors.religion }}</span>
          </label>

          <label class="field">
            <span>สัญชาติ</span>
            <input v-model="form.nationality" class="input" type="text" placeholder="สัญชาติ" />
            <span v-if="formErrors.nationality" class="field-error">{{ formErrors.nationality }}</span>
          </label>

          <label class="field">
            <span>ห้องเรียนปัจจุบัน</span>
            <AdminSearchSelect v-model="form.currentClassroomId" :options="classroomOptions" placeholder="เลือกห้องเรียน" />
          </label>

          <label class="field">
            <span>ครูที่ปรึกษา</span>
            <AdminSearchSelect v-model="form.advisorTeacherId" :options="advisorOptions" placeholder="เลือกครูที่ปรึกษา" />
          </label>

          <label class="field">
            <span>เลขบัตรประชาชน</span>
            <input v-model="form.citizenId" class="input" type="text" inputmode="numeric" placeholder="13 หลัก" @input="onCitizenIdInput" />
            <span v-if="formErrors.citizenId" class="field-error">{{ formErrors.citizenId }}</span>
          </label>

          <label class="field">
            <span>เบอร์โทรศัพท์</span>
            <input v-model="form.phone" class="input" type="text" placeholder="08x-xxx-xxxx" @input="onPhoneInput" />
            <span v-if="formErrors.phone" class="field-error">{{ formErrors.phone }}</span>
          </label>

          <label class="field">
            <span>เลขที่ประจำห้อง</span>
            <input v-model.number="form.defaultStudentNo" class="input" type="number" min="1" placeholder="เช่น 12" />
          </label>

          <label class="field">
            <span>สถานะบัญชี</span>
            <AdminSearchSelect v-model="form.status" :options="statusOptions" placeholder="เลือกสถานะ" :searchable="false" />
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
      </AdminAppModal>

      <AdminAppConfirmModal
        v-model="showConfirm"
        :description="`ต้องการลบนักเรียน '${deleteTarget?.name}' ออกจากระบบหรือไม่?`"
        @confirm="confirmDelete"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

definePageMeta({ layout: 'admin' })

type BaseResponse<T> = { data: T }

type ResponseErrorMessage = {
  code?: string
  message?: string
  input?: string
}

type ApiErrorPayload = {
  status?: {
    code?: string
    message?: string
  }
  data?: {
    errors?: Record<string, ResponseErrorMessage>
  }
}

type StudentApiItem = {
  id: string
  member_id: string
  gender_id: string | null
  prefix_id: string | null
  advisor_teacher_id: string | null
  current_classroom_id: string | null
  student_code: string | null
  default_student_no: number | null
  first_name: string | null
  last_name: string | null
  nick_name: string | null
  dob: string | null
  blood_type: string | null
  religion: string | null
  nationality: string | null
  citizen_id: string | null
  phone: string | null
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

type TeacherApiItem = {
  id: string
  teacher_code: string | null
  first_name: string | null
  last_name: string | null
}

type ClassroomItem = {
  id: string
  name: string
  grade_level: string | null
  room_no: string | null
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

type StudentRow = {
  studentId: string
  memberId: string
  genderId: string
  prefixId: string
  advisorTeacherId: string
  currentClassroomId: string
  gender: string
  prefix: string
  firstName: string
  lastName: string
  nickName: string
  dob: string
  bloodType: string
  religion: string
  nationality: string
  code: string
  name: string
  classroom: string
  advisor: string
  defaultStudentNo: number | null
  citizenId: string
  phone: string
  addresses: AddressRecord[]
  status: string
  email: string
}

type StudentForm = {
  studentId: string
  memberId: string
  genderId: string
  prefixId: string
  advisorTeacherId: string
  currentClassroomId: string
  firstName: string
  lastName: string
  nickName: string
  dob: string
  bloodType: string
  religion: string
  nationality: string
  code: string
  defaultStudentNo: number | null
  citizenId: string
  phone: string
  addresses: AddressRecord[]
  status: string
  email: string
  password: string
}

const { loading } = usePageLoad()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('edu_auth_token')
const { profile } = useAdminAuth()

const rows = ref<StudentRow[]>([])
const pageLoading = ref(false)
const errorMessage = ref('')
const genderRows = ref<GenderItem[]>([])
const prefixRows = ref<PrefixItem[]>([])
const teacherRows = ref<TeacherApiItem[]>([])
const classroomRows = ref<ClassroomItem[]>([])

const cols = [
  { key: 'code', label: 'รหัสนักเรียน' },
  { key: 'name', label: 'ชื่อ-นามสกุล' },
  { key: 'classroom', label: 'ห้องเรียน' },
  { key: 'advisor', label: 'ครูที่ปรึกษา' },
  { key: 'phone', label: 'เบอร์โทร' },
  { key: 'status', label: 'สถานะ' },
]

const filterStudentId = ref('')
const filterClassroom = ref('')

const classroomFilterOptions = computed(() => classroomRows.value.map(item => ({ label: item.name, value: item.id })))

const filteredRows = computed(() =>
  rows.value.filter((r) => {
    const matchStudent = !filterStudentId.value || r.studentId === filterStudentId.value
    const matchClassroom = !filterClassroom.value || r.currentClassroomId === filterClassroom.value
    return matchStudent && matchClassroom
  }),
)

const statusOptions = [
  { label: 'ปกติ', value: 'ปกติ' },
  { label: 'ไม่ใช้งาน', value: 'ไม่ใช้งาน' },
]

const bloodTypeOptions = [
  { label: 'ไม่ระบุกรุ๊ปเลือด', value: '' },
  { label: 'A', value: 'A' },
  { label: 'B', value: 'B' },
  { label: 'AB', value: 'AB' },
  { label: 'O', value: 'O' },
  { label: 'A+', value: 'A+' },
  { label: 'A-', value: 'A-' },
  { label: 'B+', value: 'B+' },
  { label: 'B-', value: 'B-' },
  { label: 'AB+', value: 'AB+' },
  { label: 'AB-', value: 'AB-' },
  { label: 'O+', value: 'O+' },
  { label: 'O-', value: 'O-' },
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

const advisorOptions = computed(() => [
  { label: 'ไม่ระบุครูที่ปรึกษา', value: '' },
  ...teacherRows.value.map(item => ({
    label: `${(item.first_name || '').trim()} ${(item.last_name || '').trim()}`.trim() || item.teacher_code || item.id,
    value: item.id,
  })),
])

const classroomOptions = computed(() => [
  { label: 'ไม่ระบุห้องเรียน', value: '' },
  ...classroomRows.value.map(item => ({ label: item.name, value: item.id })),
])

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
  return isActive ? 'ปกติ' : 'ไม่ใช้งาน'
}

function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return false
  return date.toISOString().slice(0, 10) === value
}

function normalizeDobValue(value: string | null | undefined): string {
  const raw = (value || '').trim()
  if (!raw) return ''

  const directDateMatch = raw.match(/^(\d{4}-\d{2}-\d{2})/)
  if (directDateMatch) return directDateMatch[1]

  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10)
  return raw
}

function toIsActive(status: string) {
  return status === 'ปกติ'
}

function clearFilters() {
  filterStudentId.value = ''
  filterClassroom.value = ''
}

function mapStudentRow(item: StudentApiItem): StudentRow {
  const genderNameById = new Map(genderRows.value.map(g => [g.id, g.name] as const))
  const prefixNameById = new Map(prefixRows.value.map(p => [p.id, p.name] as const))
  const teacherNameById = new Map(teacherRows.value.map(t => {
    const label = `${(t.first_name || '').trim()} ${(t.last_name || '').trim()}`.trim() || t.teacher_code || t.id
    return [t.id, label] as const
  }))
  const classroomNameById = new Map(classroomRows.value.map(c => [c.id, c.name] as const))

  const gender = (item.gender_id && genderNameById.get(item.gender_id)) || ''
  const prefix = (item.prefix_id && prefixNameById.get(item.prefix_id)) || ''
  const firstName = (item.first_name || '').trim()
  const lastName = (item.last_name || '').trim()

  return {
    studentId: item.id,
    memberId: item.member_id,
    genderId: item.gender_id || '',
    prefixId: item.prefix_id || '',
    advisorTeacherId: item.advisor_teacher_id || '',
    currentClassroomId: item.current_classroom_id || '',
    gender,
    prefix,
    firstName,
    lastName,
    nickName: (item.nick_name || '').trim(),
    dob: normalizeDobValue(item.dob),
    bloodType: (item.blood_type || '').trim(),
    religion: (item.religion || '').trim(),
    nationality: (item.nationality || '').trim(),
    code: (item.student_code || '').trim() || item.id,
    name: fullName(prefix, firstName, lastName) || '-',
    classroom: (item.current_classroom_id && classroomNameById.get(item.current_classroom_id)) || '-',
    advisor: (item.advisor_teacher_id && teacherNameById.get(item.advisor_teacher_id)) || '-',
    defaultStudentNo: item.default_student_no,
    citizenId: (item.citizen_id || '').trim(),
    phone: (item.phone || '').trim(),
    addresses: mapAddressRecords(item.addresses),
    status: mapStatus(Boolean(item.is_active)),
    email: '',
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
    const classroomQuery = profile.value.schoolId ? `?school_id=${profile.value.schoolId}` : ''

    const [studentsRes, gendersRes, prefixesRes, teachersRes, classroomsRes] = await Promise.all([
      apiFetch<BaseResponse<StudentApiItem[]>>('/students?only_active=false', { headers: authHeaders() }),
      apiFetch<BaseResponse<GenderItem[]>>('/genders?only_active=false', { headers: authHeaders() }),
      apiFetch<BaseResponse<PrefixItem[]>>('/prefixes?only_active=false', { headers: authHeaders() }),
      apiFetch<BaseResponse<TeacherApiItem[]>>('/teachers?only_active=false', { headers: authHeaders() }),
      apiFetch<BaseResponse<ClassroomItem[]>>(`/classrooms${classroomQuery}`, { headers: authHeaders() }),
    ])

    genderRows.value = Array.isArray(gendersRes.data) ? gendersRes.data : []
    prefixRows.value = Array.isArray(prefixesRes.data) ? prefixesRes.data : []
    teacherRows.value = Array.isArray(teachersRes.data) ? teachersRes.data : []
    classroomRows.value = Array.isArray(classroomsRes.data) ? classroomsRes.data : []

    const students = Array.isArray(studentsRes.data) ? studentsRes.data : []
    rows.value = students.map(mapStudentRow)
  }
  catch {
    errorMessage.value = 'ไม่สามารถโหลดข้อมูลนักเรียนได้'
    rows.value = []
  }
  finally {
    pageLoading.value = false
  }
}

if (import.meta.client) {
  loadRows()
}

const showModal = ref(false)
const showConfirm = ref(false)
const editTarget = ref<StudentRow | null>(null)
const deleteTarget = ref<StudentRow | null>(null)

const emptyForm = (): StudentForm => ({
  studentId: '',
  memberId: '',
  genderId: '',
  prefixId: '',
  advisorTeacherId: '',
  currentClassroomId: '',
  firstName: '',
  lastName: '',
  nickName: '',
  dob: '',
  bloodType: '',
  religion: '',
  nationality: '',
  code: '',
  defaultStudentNo: null,
  citizenId: '',
  phone: '',
  addresses: [],
  status: 'ปกติ',
  email: '',
  password: '',
})

const form = ref<StudentForm>(emptyForm())
const formErrors = ref({ firstName: '', lastName: '', nickName: '', dob: '', bloodType: '', religion: '', nationality: '', citizenId: '', phone: '', email: '', password: '' })

function openAdd() {
  editTarget.value = null
  form.value = emptyForm()
  formErrors.value = { firstName: '', lastName: '', nickName: '', dob: '', bloodType: '', religion: '', nationality: '', citizenId: '', phone: '', email: '', password: '' }
  showModal.value = true
}

function openEdit(row: StudentRow) {
  editTarget.value = row
  form.value = {
    studentId: row.studentId,
    memberId: row.memberId,
    genderId: row.genderId,
    prefixId: row.prefixId,
    advisorTeacherId: row.advisorTeacherId,
    currentClassroomId: row.currentClassroomId,
    firstName: row.firstName,
    lastName: row.lastName,
    nickName: row.nickName,
    dob: row.dob,
    bloodType: row.bloodType,
    religion: row.religion,
    nationality: row.nationality,
    code: row.code,
    defaultStudentNo: row.defaultStudentNo,
    citizenId: row.citizenId,
    phone: row.phone,
    addresses: row.addresses.map((item, index) => ({ ...item, sortOrder: Number.isFinite(item.sortOrder) ? item.sortOrder : index })),
    status: row.status,
    email: '',
    password: '',
  }
  formErrors.value = { firstName: '', lastName: '', nickName: '', dob: '', bloodType: '', religion: '', nationality: '', citizenId: '', phone: '', email: '', password: '' }
  showModal.value = true
}

function validate() {
  formErrors.value = { firstName: '', lastName: '', nickName: '', dob: '', bloodType: '', religion: '', nationality: '', citizenId: '', phone: '', email: '', password: '' }

  const firstName = form.value.firstName.trim()
  const lastName = form.value.lastName.trim()
  const nickName = form.value.nickName.trim()
  const dob = form.value.dob.trim()
  const bloodType = form.value.bloodType.trim()
  const religion = form.value.religion.trim()
  const nationality = form.value.nationality.trim()
  const citizenId = form.value.citizenId.trim()
  const phone = form.value.phone.trim()

  if (!firstName) formErrors.value.firstName = 'กรุณาระบุชื่อ'
  else if (firstName.length > 255) formErrors.value.firstName = 'ชื่อต้องไม่เกิน 255 ตัวอักษร'

  if (!lastName) formErrors.value.lastName = 'กรุณาระบุนามสกุล'
  else if (lastName.length > 255) formErrors.value.lastName = 'นามสกุลต้องไม่เกิน 255 ตัวอักษร'

  if (nickName.length > 255) formErrors.value.nickName = 'ชื่อเล่นต้องไม่เกิน 255 ตัวอักษร'
  if (dob && !isValidDateString(dob)) formErrors.value.dob = 'วันเกิดต้องอยู่ในรูปแบบ YYYY-MM-DD'
  if (bloodType.length > 10) formErrors.value.bloodType = 'กรุ๊ปเลือดต้องไม่เกิน 10 ตัวอักษร'
  if (religion.length > 100) formErrors.value.religion = 'ศาสนาต้องไม่เกิน 100 ตัวอักษร'
  if (nationality.length > 100) formErrors.value.nationality = 'สัญชาติต้องไม่เกิน 100 ตัวอักษร'
  if (citizenId.length > 13) formErrors.value.citizenId = 'เลขบัตรประชาชนต้องไม่เกิน 13 ตัวอักษร'
  if (phone.length > 50) formErrors.value.phone = 'เบอร์โทรศัพท์ต้องไม่เกิน 50 ตัวอักษร'

  if (!editTarget.value) {
    if (!form.value.email.trim()) formErrors.value.email = 'กรุณาระบุอีเมล'
    if (form.value.password.trim().length < 6) formErrors.value.password = 'รหัสผ่านต้องอย่างน้อย 6 ตัวอักษร'
  }

  return !formErrors.value.firstName
    && !formErrors.value.lastName
    && !formErrors.value.nickName
    && !formErrors.value.dob
    && !formErrors.value.bloodType
    && !formErrors.value.religion
    && !formErrors.value.nationality
    && !formErrors.value.citizenId
    && !formErrors.value.phone
    && !formErrors.value.email
    && !formErrors.value.password
}

function onCitizenIdInput() {
  const normalized = form.value.citizenId.replace(/\D+/g, '').slice(0, 13)
  if (normalized !== form.value.citizenId) form.value.citizenId = normalized
  if (formErrors.value.citizenId && normalized.length <= 13) formErrors.value.citizenId = ''
}

function onPhoneInput() {
  form.value.phone = form.value.phone.slice(0, 50)
  if (formErrors.value.phone && form.value.phone.length <= 50) formErrors.value.phone = ''
}

function addAddress() {
  form.value.addresses.push({ label: '', addressLine: '', isPrimary: form.value.addresses.length === 0, sortOrder: form.value.addresses.length })
}

function removeAddress(index: number) {
  form.value.addresses.splice(index, 1)
  form.value.addresses = form.value.addresses.map((item, idx) => ({ ...item, sortOrder: idx }))
  if (form.value.addresses.length > 0 && !form.value.addresses.some(item => item.isPrimary)) {
    form.value.addresses[0].isPrimary = true
  }
}

function extractServerError(err: unknown): ApiErrorPayload {
  if (!err || typeof err !== 'object') return {}
  const asRecord = err as Record<string, unknown>
  const data = asRecord.data
  if (!data || typeof data !== 'object') return {}
  return data as ApiErrorPayload
}

function mapServerErrorsToForm(err: unknown) {
  const payload = extractServerError(err)
  const errors = payload.data?.errors
  if (!errors || typeof errors !== 'object') return false

  const fieldMap: Record<string, keyof typeof formErrors.value> = {
    first_name: 'firstName',
    last_name: 'lastName',
    nick_name: 'nickName',
    dob: 'dob',
    blood_type: 'bloodType',
    religion: 'religion',
    nationality: 'nationality',
    citizen_id: 'citizenId',
    phone: 'phone',
    email: 'email',
    password: 'password',
  }

  let hasMapped = false
  for (const [rawField, detail] of Object.entries(errors)) {
    const mapped = fieldMap[rawField]
    if (!mapped) continue
    formErrors.value[mapped] = detail?.message || 'ข้อมูลไม่ถูกต้อง'
    hasMapped = true
  }
  return hasMapped
}

function mapServerMessageToForm(err: unknown) {
  const payload = extractServerError(err)
  const messageKey = payload.status?.message || ''
  if (!messageKey) return false

  if (messageKey === 'member-email-duplicate') {
    formErrors.value.email = 'อีเมลนี้ถูกใช้งานแล้ว'
    return true
  }
  if (messageKey === 'student-code-duplicate') {
    errorMessage.value = 'รหัสนักเรียนซ้ำในระบบ'
    return true
  }
  return false
}

async function saveRow() {
  if (!validate() || !authToken.value) return

  try {
    if (editTarget.value) {
      await apiFetch(`/students/${editTarget.value.studentId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: {
          member_id: form.value.memberId,
          gender_id: form.value.genderId || null,
          prefix_id: form.value.prefixId || null,
          advisor_teacher_id: form.value.advisorTeacherId || null,
          current_classroom_id: form.value.currentClassroomId || null,
          student_code: form.value.code.trim() || null,
          default_student_no: form.value.defaultStudentNo || null,
          first_name: form.value.firstName.trim() || null,
          last_name: form.value.lastName.trim() || null,
          nick_name: form.value.nickName.trim() || null,
          dob: normalizeDobValue(form.value.dob) || null,
          blood_type: form.value.bloodType.trim() || null,
          religion: form.value.religion.trim() || null,
          nationality: form.value.nationality.trim() || null,
          citizen_id: form.value.citizenId.trim() || null,
          phone: form.value.phone.trim() || null,
          addresses: toAddressPayload(form.value.addresses),
          is_active: toIsActive(form.value.status),
        },
      })
    }
    else {
      const schoolId = profile.value.schoolId
      if (!schoolId) {
        errorMessage.value = 'ไม่พบ school_id ใน session'
        return
      }

      await apiFetch('/onboarding/students/register', {
        method: 'POST',
        headers: authHeaders(),
        body: {
          school_id: schoolId,
          email: form.value.email.trim(),
          password: form.value.password.trim(),
          gender_id: form.value.genderId || null,
          prefix_id: form.value.prefixId || null,
          advisor_teacher_id: form.value.advisorTeacherId || null,
          current_classroom_id: form.value.currentClassroomId || null,
          student_code: form.value.code.trim() || null,
          default_student_no: form.value.defaultStudentNo || null,
          first_name: form.value.firstName.trim() || null,
          last_name: form.value.lastName.trim() || null,
          nick_name: form.value.nickName.trim() || null,
          dob: normalizeDobValue(form.value.dob) || null,
          blood_type: form.value.bloodType.trim() || null,
          religion: form.value.religion.trim() || null,
          nationality: form.value.nationality.trim() || null,
          citizen_id: form.value.citizenId.trim() || null,
          phone: form.value.phone.trim() || null,
          addresses: toAddressPayload(form.value.addresses),
          is_active: toIsActive(form.value.status),
        },
      })
    }

    showModal.value = false
    await loadRows()
  }
  catch (err) {
    if (mapServerErrorsToForm(err) || mapServerMessageToForm(err)) return
    errorMessage.value = 'บันทึกข้อมูลนักเรียนไม่สำเร็จ'
  }
}

function openDetail(row: StudentRow) {
  navigateTo(`/admin/students/${encodeURIComponent(row.studentId)}`)
}

function openDelete(row: StudentRow) {
  deleteTarget.value = row
  showConfirm.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value || !authToken.value) {
    showConfirm.value = false
    return
  }

  try {
    await apiFetch(`/students/${deleteTarget.value.studentId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })

    showConfirm.value = false
    deleteTarget.value = null
    await loadRows()
  }
  catch {
    errorMessage.value = 'ลบข้อมูลนักเรียนไม่สำเร็จ'
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
.sel { cursor: pointer; }

.btn { display: inline-flex; align-items: center; gap: 6px; border-radius: 8px; padding: 8px 14px; font-size: 0.875rem; font-weight: 500; border: 1px solid transparent; background: #fff; color: #111827; cursor: pointer; font-family: inherit; transition: background 0.12s; }
.btn-primary { background: #111827; color: #fff; border-color: #111827; }
.btn-primary:hover { background: #1f2937; }

.action-btns { display: flex; gap: 6px; justify-content: flex-end; flex-wrap: nowrap; }
.btn-sm { padding: 5px 10px; font-size: 0.8rem; }
.btn-edit { border-color: #bfdbfe; background: #eff6ff; color: #1d4ed8; }
.btn-edit:hover { background: #dbeafe; border-color: #93c5fd; }
.btn-detail { border-color: #e5e7eb; background: #fff; color: #374151; }
.btn-detail:hover { background: #f9fafb; }
.btn-delete { border-color: #fecaca; background: #fff5f5; color: #dc2626; }
.btn-delete:hover { background: #fee2e2; }
.btn-clear { border: 1px solid #e5e7eb; background: #fff; color: #6b7280; font-size: 0.8rem; padding: 7px 12px; white-space: nowrap; font-family: inherit; cursor: pointer; border-radius: 8px; font-weight: 500; }
.btn-clear:hover { background: #f9fafb; color: #374151; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 5px; font-size: 0.83rem; font-weight: 500; color: #374151; }
.field--full { grid-column: 1 / -1; }
.req { color: #ef4444; }
.field-error { font-size: 0.75rem; color: #ef4444; margin-top: 2px; }
.field-hint { font-size: 0.75rem; color: #6b7280; }
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
</style>
