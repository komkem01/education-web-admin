<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading || pageLoading" :rows="4" :cols="2" />
    <template v-else>
      <div v-if="!record" class="not-found">
        <p class="not-found-text">ไม่พบข้อมูลห้องเรียน</p>
        <button class="btn btn-primary" @click="navigateTo('/admin/classrooms')">กลับรายการ</button>
      </div>

      <template v-else>
        <div class="page-header">
          <div class="header-left">
            <button class="btn btn-back" @click="navigateTo('/admin/classrooms')">กลับ</button>
            <div>
              <h2 class="page-title">{{ record.name }}</h2>
              <p class="page-desc">ห้องเรียน {{ record.grade || 'ไม่ระบุระดับชั้น' }}</p>
              <p v-if="errorMessage" class="inline-error">{{ errorMessage }}</p>
            </div>
          </div>
          <div class="header-actions">
            <button class="btn btn-edit" @click="openEdit">แก้ไข</button>
            <button class="btn btn-delete" @click="showConfirm = true">ลบ</button>
          </div>
        </div>

        <div class="detail-card">
          <p class="section-title">ข้อมูลห้องเรียน</p>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">ชื่อห้องเรียน</span>
              <span class="detail-value">{{ record.name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">ระดับชั้น</span>
              <span class="detail-value">{{ record.grade || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">ห้องที่ใช้เรียน</span>
              <span class="detail-value">{{ record.room || '-' }}</span>
            </div>
            <div class="detail-item detail-item--full">
              <span class="detail-label">ครูประจำชั้น</span>
              <span class="detail-value">{{ record.advisorTeacherName || '-' }}</span>
            </div>
          </div>
        </div>
      </template>

      <AdminAppModal
        v-model="showModal"
        title="แก้ไขห้องเรียน"
        size="md"
        confirm-label="บันทึก"
        @confirm="saveRow"
      >
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">ชื่อห้องเรียน <span class="req">*</span></label>
            <input v-model="form.name" class="form-input" placeholder="เช่น ม.1/1" />
            <span v-if="formErrors.name" class="field-error">{{ formErrors.name }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">ระดับชั้น</label>
            <select v-model="form.grade" class="form-input">
              <option value="">— ไม่ระบุ —</option>
              <option v-for="g in gradeOptions" :key="g" :value="g">{{ g }}</option>
            </select>
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">ห้องที่ใช้เรียน</label>
            <input v-model="form.room" class="form-input" placeholder="เช่น อาคาร 1 ห้อง 101" />
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">ครูประจำชั้น</label>
            <input
              v-model="form.advisorTeacherName"
              class="form-input"
              list="teacher-name-suggestions-detail"
              placeholder="พิมพ์เพื่อค้นหาชื่อครู"
              autocomplete="off"
            />
            <datalist id="teacher-name-suggestions-detail">
              <option v-for="t in teacherOptions" :key="t.id" :value="t.name" />
            </datalist>
          </div>
        </div>
      </AdminAppModal>

      <AdminAppConfirmModal
        v-model="showConfirm"
        :title="`ลบห้องเรียน ${record?.name ?? ''}?`"
        description="ข้อมูลห้องเรียนนี้จะถูกลบออกจากระบบ ไม่สามารถกู้คืนได้"
        @confirm="confirmDelete"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

definePageMeta({ layout: 'admin' })

const { loading } = usePageLoad()
const route = useRoute()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('edu_auth_token')
const { profile } = useAdminAuth()

type ClassroomApiItem = {
  id: string
  school_id: string
  name: string
  grade_level: string | null
  room_no: string | null
  advisor_teacher_id: string | null
}

type ClassroomSingleResponse = {
  data: ClassroomApiItem
}

type ClassroomRow = {
  id: string
  name: string
  grade: string
  room: string
  advisorTeacherId: string
  advisorTeacherName: string
}

type TeacherApiItem = {
  id: string
  first_name: string | null
  last_name: string | null
  is_active: boolean
}

type TeacherListResponse = {
  data: TeacherApiItem[]
}

type TeacherOption = {
  id: string
  name: string
}

const id = computed(() => String(route.params.id ?? ''))

const record = ref<ClassroomRow | null>(null)
const teacherOptions = ref<TeacherOption[]>([])
const pageLoading = ref(false)
const errorMessage = ref('')

const showModal = ref(false)
const showConfirm = ref(false)
const gradeOptions = ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6']

const form = ref<ClassroomRow>({ id: '', name: '', grade: '', room: '', advisorTeacherId: '', advisorTeacherName: '' })
const formErrors = ref({ name: '' })

function authHeaders() {
  return { Authorization: `Bearer ${authToken.value}` }
}

function mapClassroom(item: ClassroomApiItem): ClassroomRow {
  const foundTeacher = teacherOptions.value.find(t => t.id === (item.advisor_teacher_id || ''))
  return {
    id: String(item.id || ''),
    name: String(item.name || ''),
    grade: String(item.grade_level || ''),
    room: String(item.room_no || ''),
    advisorTeacherId: String(item.advisor_teacher_id || ''),
    advisorTeacherName: foundTeacher?.name || '',
  }
}

function mapTeacherName(item: TeacherApiItem) {
  const first = String(item.first_name || '').trim()
  const last = String(item.last_name || '').trim()
  const fullName = `${first} ${last}`.trim()
  return fullName || String(item.id || '')
}

async function loadTeachers() {
  if (!import.meta.client || !authToken.value) return

  try {
    const res = await $fetch<TeacherListResponse>(`${config.public.apiBase}/back-office/teachers?only_active=true`, {
      headers: authHeaders(),
    })
    const list = Array.isArray(res.data) ? res.data : []
    teacherOptions.value = list.map(item => ({ id: item.id, name: mapTeacherName(item) }))
  }
  catch {
    try {
      const res = await $fetch<TeacherListResponse>(`${config.public.apiBase}/teachers?only_active=true`, {
        headers: authHeaders(),
      })
      const list = Array.isArray(res.data) ? res.data : []
      teacherOptions.value = list.map(item => ({ id: item.id, name: mapTeacherName(item) }))
    }
    catch {
      teacherOptions.value = []
    }
  }
}

async function loadRecord() {
  if (!import.meta.client || !authToken.value || !id.value) return

  pageLoading.value = true
  errorMessage.value = ''

  try {
    const res = await $fetch<ClassroomSingleResponse>(`${config.public.apiBase}/back-office/classrooms/${id.value}`, {
      headers: authHeaders(),
    })
    record.value = mapClassroom(res.data)
  }
  catch {
    try {
      const res = await $fetch<ClassroomSingleResponse>(`${config.public.apiBase}/classrooms/${id.value}`, {
        headers: authHeaders(),
      })
      record.value = mapClassroom(res.data)
    }
    catch {
      record.value = null
      errorMessage.value = 'ไม่สามารถโหลดข้อมูลห้องเรียนได้'
    }
  }
  finally {
    pageLoading.value = false
  }
}

watch(id, async () => {
  await loadTeachers()
  await loadRecord()
}, { immediate: true })

watch(() => form.value.advisorTeacherName, (value) => {
  const query = value.trim()
  if (!query) {
    form.value.advisorTeacherId = ''
    return
  }

  const found = teacherOptions.value.find(t => t.name.toLowerCase() === query.toLowerCase())
  form.value.advisorTeacherId = found?.id || ''
})

function openEdit() {
  if (!record.value) return
  form.value = { ...record.value }
  formErrors.value = { name: '' }
  showModal.value = true
}

function validate() {
  formErrors.value = { name: '' }
  if (!form.value.name.trim()) formErrors.value.name = 'กรุณาระบุชื่อห้อง'
  return !formErrors.value.name
}

async function saveRow() {
  if (!validate() || !record.value || !authToken.value) return

  const schoolId = profile.value.schoolId
  if (!schoolId) {
    errorMessage.value = 'ไม่พบ school_id ใน session'
    return
  }

  const payload = {
    school_id: schoolId,
    name: form.value.name.trim(),
    grade_level: form.value.grade.trim() || null,
    room_no: form.value.room.trim() || null,
    advisor_teacher_id: form.value.advisorTeacherId.trim() || null,
  }

  try {
    await $fetch<ClassroomSingleResponse>(`${config.public.apiBase}/back-office/classrooms/${record.value.id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: payload,
    })
  }
  catch {
    try {
      await $fetch<ClassroomSingleResponse>(`${config.public.apiBase}/classrooms/${record.value.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: payload,
      })
    }
    catch {
      errorMessage.value = 'บันทึกข้อมูลห้องเรียนไม่สำเร็จ'
      return
    }
  }

  showModal.value = false
  await loadRecord()
}

async function confirmDelete() {
  if (!record.value || !authToken.value) {
    showConfirm.value = false
    return
  }

  try {
    await $fetch(`${config.public.apiBase}/back-office/classrooms/${record.value.id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
  }
  catch {
    try {
      await $fetch(`${config.public.apiBase}/classrooms/${record.value.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
    }
    catch {
      errorMessage.value = 'ลบข้อมูลห้องเรียนไม่สำเร็จ'
      showConfirm.value = false
      return
    }
  }

  showConfirm.value = false
  navigateTo('/admin/classrooms')
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 22px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.header-left { display: flex; align-items: flex-start; gap: 12px; }
.header-actions { display: flex; gap: 8px; }
.page-title { font-size: 1.3rem; font-weight: 700; margin: 0; color: #111827; }
.page-desc { color: #6b7280; margin-top: 4px; font-size: 0.85rem; }
.inline-error { margin-top: 6px; color: #dc2626; font-size: 0.82rem; }
.btn { display: inline-flex; align-items: center; gap: 5px; border-radius: 8px; padding: 8px 14px; font-size: 0.875rem; font-weight: 500; border: 1px solid #d1d5db; background: #fff; color: #374151; cursor: pointer; font-family: inherit; transition: background 0.12s; }
.btn:hover { background: #f9fafb; }
.btn-back { color: #6b7280; padding: 7px 12px; font-size: 0.82rem; margin-top: 2px; }
.btn-back:hover { color: #374151; }
.btn-primary { background: #111827; color: #fff; border-color: #111827; }
.btn-primary:hover { background: #1f2937; }
.btn-edit { border-color: #bfdbfe; background: #eff6ff; color: #1d4ed8; }
.btn-edit:hover { background: #dbeafe; }
.btn-delete { border-color: #fecaca; background: #fff5f5; color: #dc2626; }
.btn-delete:hover { background: #fee2e2; }
.detail-card { background: #fff; border: 1px solid #e8eaed; border-radius: 14px; padding: 24px; }
.section-title { font-size: 0.78rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 18px; padding-bottom: 10px; border-bottom: 1px solid #f3f4f6; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px 32px; }
.detail-item { display: flex; flex-direction: column; gap: 5px; }
.detail-item--full { grid-column: 1 / -1; }
.detail-label { font-size: 0.72rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
.detail-value { font-size: 0.95rem; color: #111827; font-weight: 500; word-break: break-word; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-group { display: flex; flex-direction: column; gap: 5px; }
.form-group--full { grid-column: 1 / -1; }
.form-label { font-size: 0.82rem; font-weight: 500; color: #374151; }
.req { color: #ef4444; }
.form-input { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 12px; font-size: 0.875rem; font-family: inherit; background: #fff; color: #111827; outline: none; transition: border-color 0.12s; width: 100%; box-sizing: border-box; }
.form-input:focus { border-color: #6366f1; }
.field-error { font-size: 0.75rem; color: #ef4444; }
.not-found { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 60px 0; color: #9ca3af; }
.not-found-text { font-size: 1rem; }
@media (max-width: 760px) {
  .detail-grid { grid-template-columns: 1fr; }
  .form-grid { grid-template-columns: 1fr; }
}
</style>
