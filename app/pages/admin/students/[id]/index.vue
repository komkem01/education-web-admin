<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading || pageLoading" :rows="5" :cols="2" />
    <template v-else>
      <div v-if="!record" class="not-found">
        <p class="not-found-text">ไม่พบข้อมูลนักเรียน</p>
        <button class="btn btn-primary" @click="navigateTo('/admin/students')">กลับรายการ</button>
      </div>

      <template v-else>
        <div class="page-header">
          <div class="header-left">
            <button class="btn btn-back" @click="navigateTo('/admin/students')">กลับ</button>
            <div>
              <h2 class="page-title">{{ record.name }}</h2>
              <p class="page-desc">{{ record.classroom }} · รหัส {{ record.code }}</p>
              <p v-if="errorMessage" class="inline-error">{{ errorMessage }}</p>
            </div>
          </div>
          <div class="header-actions">
            <AdminStatusBadge :label="record.status" :variant="record.status === 'ปกติ' ? 'approved' : 'default'" />
            <button class="btn btn-edit" @click="openEdit">แก้ไข</button>
            <button class="btn btn-delete" @click="showConfirm = true">ลบ</button>
          </div>
        </div>

        <div class="detail-card">
          <p class="section-title">ข้อมูลนักเรียน</p>
          <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">รหัสนักเรียน</span><span class="detail-value mono">{{ record.code }}</span></div>
            <div class="detail-item"><span class="detail-label">สถานะ</span><span class="detail-value"><AdminStatusBadge :label="record.status" :variant="record.status === 'ปกติ' ? 'approved' : 'default'" /></span></div>
            <div class="detail-item"><span class="detail-label">อีเมล</span><span class="detail-value">{{ record.email || '-' }}</span></div>
            <div class="detail-item"><span class="detail-label">เพศ</span><span class="detail-value">{{ record.gender || '-' }}</span></div>
            <div class="detail-item"><span class="detail-label">คำนำหน้า</span><span class="detail-value">{{ record.prefix || '-' }}</span></div>
            <div class="detail-item"><span class="detail-label">ชื่อ</span><span class="detail-value">{{ record.firstName || '-' }}</span></div>
            <div class="detail-item"><span class="detail-label">นามสกุล</span><span class="detail-value">{{ record.lastName || '-' }}</span></div>
            <div class="detail-item"><span class="detail-label">ห้องเรียน</span><span class="detail-value">{{ record.classroom || '-' }}</span></div>
            <div class="detail-item"><span class="detail-label">ครูที่ปรึกษา</span><span class="detail-value">{{ record.advisor || '-' }}</span></div>
            <div class="detail-item"><span class="detail-label">เลขที่ประจำห้อง</span><span class="detail-value">{{ record.defaultStudentNo || '-' }}</span></div>
            <div class="detail-item"><span class="detail-label">เลขบัตรประชาชน</span><span class="detail-value mono">{{ record.citizenId || '-' }}</span></div>
            <div class="detail-item"><span class="detail-label">เบอร์โทรศัพท์</span><span class="detail-value">{{ record.phone || '-' }}</span></div>
          </div>
        </div>

        <div class="detail-card" style="margin-top: 16px;">
          <p class="section-title">ข้อมูลผู้ปกครอง</p>
          <div v-if="record.parents.length === 0" class="empty-state">ยังไม่มีข้อมูลผู้ปกครอง</div>
          <div v-else class="parent-list">
            <div v-for="parent in record.parents" :key="parent.id" class="parent-card">
              <div class="parent-top">
                <span class="parent-name">{{ parent.name }}</span>
                <span class="parent-relation">{{ relationshipLabel(parent.relationship) }}</span>
              </div>
              <div class="parent-meta">
                <span>รหัสผู้ปกครอง {{ parent.parentCode || '-' }}</span>
                <span>เบอร์โทร {{ parent.phone || '-' }}</span>
                <span>สถานะ {{ parent.isMainGuardian ? 'ผู้ปกครองหลัก' : 'ผู้ปกครอง' }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <AdminAppModal v-model="showModal" title="แก้ไขข้อมูลนักเรียน" size="md" confirm-label="บันทึก" @confirm="saveRow">
        <div class="form-grid">
          <label class="field">
            <span>รหัสนักเรียน</span>
            <div class="id-display"><span class="id-badge">{{ form.code }}</span><span class="id-hint">รหัสไม่สามารถแก้ไขได้</span></div>
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
            <span>ห้องเรียนปัจจุบัน</span>
            <AdminSearchSelect v-model="form.currentClassroomId" :options="classroomOptions" placeholder="เลือกห้องเรียน" />
          </label>

          <label class="field">
            <span>ครูที่ปรึกษา</span>
            <AdminSearchSelect v-model="form.advisorTeacherId" :options="advisorOptions" placeholder="เลือกครูที่ปรึกษา" />
          </label>

          <label class="field">
            <span>เลขบัตรประชาชน</span>
            <input v-model="form.citizenId" class="input" type="text" placeholder="13 หลัก" />
          </label>

          <label class="field">
            <span>เบอร์โทรศัพท์</span>
            <input v-model="form.phone" class="input" type="text" placeholder="08x-xxx-xxxx" />
          </label>

          <label class="field">
            <span>เลขที่ประจำห้อง</span>
            <input v-model.number="form.defaultStudentNo" class="input" type="number" min="1" placeholder="เช่น 12" />
          </label>

          <label class="field">
            <span>สถานะบัญชี</span>
            <AdminSearchSelect v-model="form.status" :options="statusOptions" placeholder="เลือกสถานะ" :searchable="false" />
          </label>
        </div>
      </AdminAppModal>

      <AdminAppConfirmModal
        v-model="showConfirm"
        :description="`ต้องการลบนักเรียน '${record?.name}' ออกจากระบบหรือไม่?`"
        @confirm="confirmDelete"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

definePageMeta({ layout: 'admin' })

type BaseResponse<T> = { data: T }

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
  citizen_id: string | null
  phone: string | null
  is_active: boolean
}

type TeacherApiItem = {
  id: string
  teacher_code: string | null
  first_name: string | null
  last_name: string | null
}

type MemberItem = {
  id: string
  school_id: string
  email: string
  role: string
  is_active: boolean
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

type StudentParentApiItem = {
  id: string
  parent_id: string
  student_id: string
  relationship: string
  is_main_guardian: boolean
  created_at: string
  parent_member_id: string
  parent_gender_id: string | null
  parent_prefix_id: string | null
  parent_code: string | null
  parent_first_name: string | null
  parent_last_name: string | null
  parent_phone: string | null
  parent_is_active: boolean
}

type StudentParentRecord = {
  id: string
  parentCode: string
  name: string
  phone: string
  relationship: string
  isMainGuardian: boolean
}

type StudentRecord = {
  studentId: string
  memberId: string
  email: string
  genderId: string
  prefixId: string
  advisorTeacherId: string
  currentClassroomId: string
  gender: string
  prefix: string
  firstName: string
  lastName: string
  code: string
  name: string
  classroom: string
  advisor: string
  defaultStudentNo: number | null
  citizenId: string
  phone: string
  status: string
  parents: StudentParentRecord[]
}

const { loading } = usePageLoad()
const route = useRoute()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('edu_auth_token')
const { profile } = useAdminAuth()

const id = computed(() => decodeURIComponent(String(route.params.id ?? '')))
const pageLoading = ref(false)
const errorMessage = ref('')
const record = ref<StudentRecord | null>(null)

const genderRows = ref<GenderItem[]>([])
const prefixRows = ref<PrefixItem[]>([])
const teacherRows = ref<TeacherApiItem[]>([])
const classroomRows = ref<ClassroomItem[]>([])

const showModal = ref(false)
const showConfirm = ref(false)

const statusOptions = [
  { label: 'ปกติ', value: 'ปกติ' },
  { label: 'ไม่ใช้งาน', value: 'ไม่ใช้งาน' },
]

const form = ref<StudentRecord>({
  studentId: '',
  memberId: '',
  email: '',
  genderId: '',
  prefixId: '',
  advisorTeacherId: '',
  currentClassroomId: '',
  gender: '',
  prefix: '',
  firstName: '',
  lastName: '',
  code: '',
  name: '',
  classroom: '',
  advisor: '',
  defaultStudentNo: null,
  citizenId: '',
  phone: '',
  status: 'ปกติ',
  parents: [],
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

function mapStatus(isActive: boolean) {
  return isActive ? 'ปกติ' : 'ไม่ใช้งาน'
}

function toIsActive(status: string) {
  return status === 'ปกติ'
}

function fullName(prefix: string, firstName: string | null, lastName: string | null) {
  const name = `${(firstName || '').trim()} ${(lastName || '').trim()}`.trim()
  if (!prefix) return name
  return `${prefix}${name ? ` ${name}` : ''}`.trim()
}

function relationshipLabel(value: string) {
  if (value === 'father') return 'บิดา'
  if (value === 'mother') return 'มารดา'
  if (value === 'guardian') return 'ผู้ปกครอง'
  return value || '-'
}

function mapStudentRecord(item: StudentApiItem): StudentRecord {
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
    email: '',
    genderId: item.gender_id || '',
    prefixId: item.prefix_id || '',
    advisorTeacherId: item.advisor_teacher_id || '',
    currentClassroomId: item.current_classroom_id || '',
    gender,
    prefix,
    firstName,
    lastName,
    code: (item.student_code || '').trim() || item.id,
    name: fullName(prefix, firstName, lastName) || '-',
    classroom: (item.current_classroom_id && classroomNameById.get(item.current_classroom_id)) || '-',
    advisor: (item.advisor_teacher_id && teacherNameById.get(item.advisor_teacher_id)) || '-',
    defaultStudentNo: item.default_student_no,
    citizenId: (item.citizen_id || '').trim(),
    phone: (item.phone || '').trim(),
    status: mapStatus(Boolean(item.is_active)),
    parents: [],
  }
}

async function loadParentsByStudentId(studentId: string) {
  const response = await apiFetch<BaseResponse<StudentParentApiItem[]>>(`/students/${studentId}/parents`, {
    headers: authHeaders(),
  })
  const items = Array.isArray(response.data) ? response.data : []

  return items.map(item => ({
    id: item.parent_id,
    parentCode: (item.parent_code || '').trim(),
    name: `${(item.parent_first_name || '').trim()} ${(item.parent_last_name || '').trim()}`.trim() || '-',
    phone: (item.parent_phone || '').trim(),
    relationship: item.relationship || '',
    isMainGuardian: Boolean(item.is_main_guardian),
  }))
}

async function loadRecord() {
  if (!import.meta.client || !authToken.value || !id.value) return

  pageLoading.value = true
  errorMessage.value = ''

  try {
    const classroomQuery = profile.value.schoolId ? `?school_id=${profile.value.schoolId}` : ''

    const [studentRes, gendersRes, prefixesRes, teachersRes, classroomsRes] = await Promise.all([
      apiFetch<BaseResponse<StudentApiItem>>(`/students/${id.value}`, { headers: authHeaders() }),
      apiFetch<BaseResponse<GenderItem[]>>('/genders?only_active=false', { headers: authHeaders() }),
      apiFetch<BaseResponse<PrefixItem[]>>('/prefixes?only_active=false', { headers: authHeaders() }),
      apiFetch<BaseResponse<TeacherApiItem[]>>('/teachers?only_active=false', { headers: authHeaders() }),
      apiFetch<BaseResponse<ClassroomItem[]>>(`/classrooms${classroomQuery}`, { headers: authHeaders() }),
    ])

    genderRows.value = Array.isArray(gendersRes.data) ? gendersRes.data : []
    prefixRows.value = Array.isArray(prefixesRes.data) ? prefixesRes.data : []
    teacherRows.value = Array.isArray(teachersRes.data) ? teachersRes.data : []
    classroomRows.value = Array.isArray(classroomsRes.data) ? classroomsRes.data : []

    const mapped = mapStudentRecord(studentRes.data)
    const memberRes = await apiFetch<BaseResponse<MemberItem>>(`/members/${mapped.memberId}`, { headers: authHeaders() })
    mapped.email = (memberRes.data?.email || '').trim()
    mapped.parents = await loadParentsByStudentId(mapped.studentId)
    record.value = mapped
  }
  catch {
    record.value = null
    errorMessage.value = 'ไม่สามารถโหลดข้อมูลนักเรียนได้'
  }
  finally {
    pageLoading.value = false
  }
}

if (import.meta.client) {
  loadRecord()
}

function openEdit() {
  if (!record.value) return
  form.value = { ...record.value }
  formErrors.value = { firstName: '', lastName: '' }
  showModal.value = true
}

function validate() {
  formErrors.value = { firstName: '', lastName: '' }
  if (!form.value.firstName.trim()) formErrors.value.firstName = 'กรุณาระบุชื่อ'
  if (!form.value.lastName.trim()) formErrors.value.lastName = 'กรุณาระบุนามสกุล'
  return !formErrors.value.firstName && !formErrors.value.lastName
}

async function saveRow() {
  if (!validate() || !record.value || !authToken.value) return

  try {
    await apiFetch(`/students/${record.value.studentId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: {
        member_id: record.value.memberId,
        gender_id: form.value.genderId || null,
        prefix_id: form.value.prefixId || null,
        advisor_teacher_id: form.value.advisorTeacherId || null,
        current_classroom_id: form.value.currentClassroomId || null,
        student_code: form.value.code.trim() || null,
        default_student_no: form.value.defaultStudentNo || null,
        first_name: form.value.firstName.trim() || null,
        last_name: form.value.lastName.trim() || null,
        citizen_id: form.value.citizenId.trim() || null,
        phone: form.value.phone.trim() || null,
        is_active: toIsActive(form.value.status),
      },
    })

    showModal.value = false
    await loadRecord()
  }
  catch {
    errorMessage.value = 'บันทึกข้อมูลนักเรียนไม่สำเร็จ'
  }
}

async function confirmDelete() {
  if (!record.value || !authToken.value) {
    showConfirm.value = false
    return
  }

  try {
    await apiFetch(`/students/${record.value.studentId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })

    showConfirm.value = false
    navigateTo('/admin/students')
  }
  catch {
    errorMessage.value = 'ลบข้อมูลนักเรียนไม่สำเร็จ'
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
.detail-card { background: #fff; border: 1px solid #e8eaed; border-radius: 14px; padding: 24px; }
.section-title { font-size: 0.78rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 18px; padding-bottom: 10px; border-bottom: 1px solid #f3f4f6; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px 32px; }
.detail-item { display: flex; flex-direction: column; gap: 5px; }
.detail-label { font-size: 0.72rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
.detail-value { font-size: 0.95rem; color: #111827; font-weight: 500; }
.detail-value.mono { font-family: monospace; letter-spacing: 0.04em; }
.empty-state { text-align: center; padding: 20px 0; color: #9ca3af; font-size: 0.875rem; }
.parent-list { display: flex; flex-direction: column; gap: 10px; }
.parent-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; background: #fff; }
.parent-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.parent-name { font-size: 0.92rem; color: #111827; font-weight: 600; }
.parent-relation { font-size: 0.78rem; color: #6b7280; background: #f3f4f6; border-radius: 999px; padding: 2px 8px; }
.parent-meta { margin-top: 6px; display: flex; flex-wrap: wrap; gap: 12px; color: #6b7280; font-size: 0.8rem; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 5px; font-size: 0.83rem; font-weight: 500; color: #374151; }
.req { color: #ef4444; }
.field-error { font-size: 0.75rem; color: #ef4444; }
.input { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 12px; font-size: 0.875rem; font-family: inherit; background: #fff; color: #111827; outline: none; transition: border-color 0.12s; }
.input:focus { border-color: #6366f1; }
.id-display { display: flex; align-items: center; gap: 8px; padding: 7px 10px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; }
.id-badge { font-size: 0.875rem; font-weight: 600; color: #374151; font-family: monospace; letter-spacing: 0.05em; }
.id-hint { font-size: 0.75rem; color: #9ca3af; }
.not-found { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 60px 0; color: #9ca3af; }
.not-found-text { font-size: 1rem; }
</style>
