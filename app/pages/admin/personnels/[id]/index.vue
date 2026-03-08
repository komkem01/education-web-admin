<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading || pageLoading" :rows="4" :cols="2" />
    <template v-else>
      <div v-if="!record" class="not-found">
        <p class="not-found-text">ไม่พบข้อมูลบุคลากร</p>
        <button class="btn btn-primary" @click="navigateTo('/admin/personnels')">กลับรายการ</button>
      </div>

      <template v-else>
        <div class="page-header">
          <div class="header-left">
            <button class="btn btn-back" @click="navigateTo('/admin/personnels')">กลับ</button>
            <div>
              <h2 class="page-title">{{ record.name }}</h2>
              <p class="page-desc">{{ record.dept }} · รหัสบุคลากร {{ record.personnelCode }}</p>
              <p v-if="errorMessage" class="inline-error">{{ errorMessage }}</p>
            </div>
          </div>
          <div class="header-actions">
            <AdminStatusBadge :label="record.status" :variant="record.status === 'ใช้งาน' ? 'approved' : 'default'" />
            <button class="btn btn-edit" @click="openEdit">แก้ไข</button>
            <button class="btn btn-delete" @click="showConfirm = true">ลบ</button>
          </div>
        </div>

        <div class="detail-card">
          <p class="section-title">ข้อมูลบุคลากร</p>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">รหัสบุคลากร</span>
              <span class="detail-value mono">{{ record.personnelCode }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">อีเมล</span>
              <span class="detail-value">{{ record.email || '-' }}</span>
            </div>
            <div class="detail-item detail-item--full">
              <span class="detail-label">ชื่อ-นามสกุล</span>
              <span class="detail-value">{{ record.name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">เพศ</span>
              <span class="detail-value">{{ record.gender || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">คำนำหน้า</span>
              <span class="detail-value">{{ record.prefix || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">ฝ่ายงาน</span>
              <span class="detail-value">{{ record.dept }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">เบอร์โทร</span>
              <span class="detail-value">{{ record.phone || '-' }}</span>
            </div>
            <div class="detail-item detail-item--full">
              <span class="detail-label">บทบาทในระบบ</span>
              <div class="tag-list">
                <span v-for="r in record.roles" :key="r" class="tag">{{ roleLabel(r) }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <AdminAppModal v-model="showModal" title="แก้ไขข้อมูลบุคลากร" size="md" confirm-label="บันทึก" @confirm="saveRow">
        <div class="form-grid">
          <label class="field field--full">
            <span>รหัสบุคลากร</span>
            <div class="id-display">
              <span class="id-badge">{{ form.personnelCode }}</span>
              <span class="id-hint">รหัสบุคลากรไม่สามารถแก้ไขได้</span>
            </div>
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
            <span>ฝ่ายงาน</span>
            <input
              v-model="form.dept"
              class="input"
              type="text"
              list="personnel-detail-dept-options"
              placeholder="ค้นหาหรือเลือกฝ่ายงาน"
              autocomplete="off"
            />
            <datalist id="personnel-detail-dept-options">
              <option v-for="d in deptOptions" :key="d" :value="d" />
            </datalist>
          </label>

          <label class="field">
            <span>เบอร์โทร</span>
            <input v-model="form.phone" class="input" type="text" placeholder="08x-xxx-xxxx" />
          </label>

          <label class="field field--full">
            <span>บทบาทในระบบ</span>
            <div class="checkbox-row">
              <label v-for="r in roleOptions" :key="r.value" class="checkbox-item">
                <input type="checkbox" :value="r.value" :checked="form.roles.includes(r.value)" @change="toggleRole(r.value)" />
                {{ r.label }}
              </label>
            </div>
            <span v-if="formErrors.roles" class="field-error">{{ formErrors.roles }}</span>
          </label>

          <label class="field">
            <span>สถานะ</span>
            <AdminSearchSelect
              v-model="form.status"
              :options="statusOptions"
              placeholder="เลือกสถานะ"
              :searchable="false"
            />
          </label>
        </div>
      </AdminAppModal>

      <AdminAppConfirmModal
        v-model="showConfirm"
        :description="`ต้องการลบ '${record?.name}' ออกจากระบบหรือไม่?`"
        @confirm="confirmDelete"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

definePageMeta({ layout: 'admin' })

const { loading } = usePageLoad()
const route = useRoute()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('edu_auth_token')

type BaseResponse<T> = { data: T }
type MemberRoleResponse = { member_id: string, roles: string[] }
type PersonnelRole = 'admin' | 'staff'

type MemberItem = {
  id: string
  school_id: string
  email: string
  role: string
  is_active: boolean
}

type StaffItem = {
  id: string
  member_id: string
  gender_id: string | null
  prefix_id: string | null
  staff_code: string | null
  first_name: string | null
  last_name: string | null
  phone: string | null
  department: string | null
  is_active: boolean
}

type AdminItem = {
  id: string
  member_id: string
  gender_id: string | null
  prefix_id: string | null
  admin_code: string | null
  first_name: string | null
  last_name: string | null
  phone: string | null
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

type PersonnelRecord = {
  memberId: string
  personnelCode: string
  firstName: string
  lastName: string
  genderId: string
  prefixId: string
  gender: string
  prefix: string
  name: string
  dept: string
  roles: string[]
  phone: string
  status: string
  email: string
  staffId: string
  adminId: string
}

const roleOptions = [
  { value: 'staff', label: 'บุคลากร (Staff)' },
  { value: 'admin', label: 'แอดมิน (Admin)' },
]
const statusOptions = [
  { label: 'ใช้งาน', value: 'ใช้งาน' },
  { label: 'ไม่ใช้งาน', value: 'ไม่ใช้งาน' },
]

const id = computed(() => decodeURIComponent(String(route.params.id ?? '')))
const pageLoading = ref(false)
const errorMessage = ref('')
const record = ref<PersonnelRecord | null>(null)
const deptOptions = ref<string[]>([])
const genderRows = ref<GenderItem[]>([])
const prefixRows = ref<PrefixItem[]>([])

const showModal = ref(false)
const showConfirm = ref(false)
const form = ref<PersonnelRecord>({ memberId: '', personnelCode: '', firstName: '', lastName: '', genderId: '', prefixId: '', gender: '', prefix: '', name: '', dept: '', roles: ['staff'], phone: '', status: 'ใช้งาน', email: '', staffId: '', adminId: '' })
const formErrors = ref({ firstName: '', lastName: '', roles: '' })
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

function roleLabel(role: string) {
  if (role === 'admin') return 'แอดมิน'
  if (role === 'staff') return 'บุคลากร'
  return role
}

function fullName(firstName: string | null, lastName: string | null) {
  return `${(firstName || '').trim()} ${(lastName || '').trim()}`.trim()
}

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

async function fetchMemberRoles(memberId: string) {
  const res = await apiFetch<BaseResponse<MemberRoleResponse>>(`/members/${memberId}/roles`, { headers: authHeaders() })
  return res.data.roles || []
}

async function loadRecord() {
  if (!import.meta.client || !authToken.value || !id.value) return

  pageLoading.value = true
  errorMessage.value = ''

  try {
    const [memberRes, staffRes, adminRes, gendersRes, prefixesRes] = await Promise.all([
      apiFetch<BaseResponse<MemberItem>>(`/members/${id.value}`, { headers: authHeaders() }),
      apiFetch<BaseResponse<StaffItem[]>>(`/staffs?member_id=${id.value}`, { headers: authHeaders() }),
      apiFetch<BaseResponse<AdminItem[]>>(`/admins?member_id=${id.value}`, { headers: authHeaders() }),
      apiFetch<BaseResponse<GenderItem[]>>('/genders?only_active=false', { headers: authHeaders() }),
      apiFetch<BaseResponse<PrefixItem[]>>('/prefixes?only_active=false', { headers: authHeaders() }),
    ])

    const member = memberRes.data
    const staff = Array.isArray(staffRes.data) ? staffRes.data[0] : null
    const admin = Array.isArray(adminRes.data) ? adminRes.data[0] : null
    genderRows.value = Array.isArray(gendersRes.data) ? gendersRes.data : []
    prefixRows.value = Array.isArray(prefixesRes.data) ? prefixesRes.data : []

    const genderNameByID = new Map(genderRows.value.map(item => [item.id, item.name] as const))
    const prefixNameByID = new Map(prefixRows.value.map(item => [item.id, item.name] as const))

    const roles: string[] = []
    if (staff) roles.push('staff')
    if (admin) roles.push('admin')
    if (roles.length === 0 && (member.role === 'staff' || member.role === 'admin')) roles.push(member.role)

    const name = fullName(staff?.first_name || admin?.first_name || null, staff?.last_name || admin?.last_name || null) || member.email
    const genderId = (staff?.gender_id || admin?.gender_id || '').trim()
    const prefixId = (staff?.prefix_id || admin?.prefix_id || '').trim()
    const dept = (staff?.department || '').trim() || 'ฝ่ายบริหาร'
    const phone = (staff?.phone || admin?.phone || '').trim()
    const active = Boolean((staff?.is_active ?? false) || (admin?.is_active ?? false))
    const personnelCode = (staff?.staff_code || '').trim() || (admin?.admin_code || '').trim() || '-'

    record.value = {
      memberId: member.id,
      personnelCode,
      firstName: (staff?.first_name || admin?.first_name || '').trim(),
      lastName: (staff?.last_name || admin?.last_name || '').trim(),
      genderId,
      prefixId,
      gender: (genderId && genderNameByID.get(genderId)) || '-',
      prefix: (prefixId && prefixNameByID.get(prefixId)) || '-',
      name,
      dept,
      roles,
      phone,
      status: active ? 'ใช้งาน' : 'ไม่ใช้งาน',
      email: member.email,
      staffId: staff?.id || '',
      adminId: admin?.id || '',
    }

    try {
      const staffsResAll = await apiFetch<BaseResponse<StaffItem[]>>('/staffs?only_active=false', { headers: authHeaders() })
      const staffsAll = Array.isArray(staffsResAll.data) ? staffsResAll.data : []
      deptOptions.value = [...new Set(staffsAll.map(item => (item.department || '').trim()).filter(Boolean))]
    }
    catch {
      deptOptions.value = []
    }
  }
  catch {
    record.value = null
    errorMessage.value = 'ไม่สามารถโหลดข้อมูลบุคลากรได้'
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
  form.value = { ...record.value, roles: [...record.value.roles] }
  formErrors.value = { firstName: '', lastName: '', roles: '' }
  showModal.value = true
}

function toggleRole(role: string) {
  const idx = form.value.roles.indexOf(role)
  if (idx >= 0) form.value.roles.splice(idx, 1)
  else form.value.roles.push(role)
}

function validate() {
  formErrors.value = { firstName: '', lastName: '', roles: '' }
  if (!form.value.firstName.trim()) formErrors.value.firstName = 'กรุณาระบุชื่อ'
  if (!form.value.lastName.trim()) formErrors.value.lastName = 'กรุณาระบุนามสกุล'
  if (form.value.roles.length === 0) formErrors.value.roles = 'กรุณาเลือกอย่างน้อย 1 บทบาท'
  return !formErrors.value.firstName && !formErrors.value.lastName && !formErrors.value.roles
}

async function ensureRoleAssignments(memberId: string, selectedRoles: PersonnelRole[]) {
  const currentRoles = await fetchMemberRoles(memberId)
  const scopedCurrent = currentRoles.filter((r): r is PersonnelRole => r === 'admin' || r === 'staff')

  for (const role of selectedRoles) {
    if (!scopedCurrent.includes(role)) {
      await apiFetch(`/members/${memberId}/roles`, {
        method: 'POST',
        headers: authHeaders(),
        body: { role },
      })
    }
  }

  for (const role of scopedCurrent) {
    if (!selectedRoles.includes(role)) {
      await apiFetch(`/members/${memberId}/roles/${role}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
    }
  }
}

async function saveRow() {
  if (!validate() || !record.value || !authToken.value) return

  const selectedRoles = [...new Set(form.value.roles.filter((r): r is PersonnelRole => r === 'admin' || r === 'staff'))]
  const active = form.value.status === 'ใช้งาน'
  const firstName = form.value.firstName.trim() || null
  const lastName = form.value.lastName.trim() || null

  try {
    await ensureRoleAssignments(record.value.memberId, selectedRoles)

    if (selectedRoles.includes('staff')) {
      const staffPayload = {
        member_id: record.value.memberId,
        gender_id: form.value.genderId || null,
        prefix_id: form.value.prefixId || null,
        first_name: firstName,
        last_name: lastName,
        phone: form.value.phone.trim() || null,
        department: form.value.dept.trim() || null,
        is_active: active,
      }
      if (record.value.staffId) {
        await apiFetch(`/staffs/${record.value.staffId}`, {
          method: 'PATCH',
          headers: authHeaders(),
          body: staffPayload,
        })
      }
      else {
        await apiFetch('/staffs', {
          method: 'POST',
          headers: authHeaders(),
          body: staffPayload,
        })
      }
    }
    else if (record.value.staffId) {
      await apiFetch(`/staffs/${record.value.staffId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
    }

    if (selectedRoles.includes('admin')) {
      const adminPayload = {
        member_id: record.value.memberId,
        gender_id: form.value.genderId || null,
        prefix_id: form.value.prefixId || null,
        first_name: firstName,
        last_name: lastName,
        phone: form.value.phone.trim() || null,
        is_active: active,
      }
      if (record.value.adminId) {
        await apiFetch(`/admins/${record.value.adminId}`, {
          method: 'PATCH',
          headers: authHeaders(),
          body: adminPayload,
        })
      }
      else {
        await apiFetch('/admins', {
          method: 'POST',
          headers: authHeaders(),
          body: adminPayload,
        })
      }
    }
    else if (record.value.adminId) {
      await apiFetch(`/admins/${record.value.adminId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
    }

    showModal.value = false
    await loadRecord()
  }
  catch {
    errorMessage.value = 'บันทึกข้อมูลบุคลากรไม่สำเร็จ'
  }
}

async function confirmDelete() {
  if (!record.value || !authToken.value) {
    showConfirm.value = false
    return
  }

  try {
    if (record.value.staffId) {
      await apiFetch(`/staffs/${record.value.staffId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      await apiFetch(`/members/${record.value.memberId}/roles/staff`, {
        method: 'DELETE',
        headers: authHeaders(),
      }).catch(() => {})
    }

    if (record.value.adminId) {
      await apiFetch(`/admins/${record.value.adminId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      await apiFetch(`/members/${record.value.memberId}/roles/admin`, {
        method: 'DELETE',
        headers: authHeaders(),
      }).catch(() => {})
    }

    showConfirm.value = false
    navigateTo('/admin/personnels')
  }
  catch {
    errorMessage.value = 'ลบข้อมูลบุคลากรไม่สำเร็จ'
    showConfirm.value = false
  }
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 22px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.header-left { display: flex; align-items: flex-start; gap: 12px; }
.header-actions { display: flex; gap: 8px; align-items: center; }
.page-title { font-size: 1.3rem; font-weight: 700; margin: 0; color: #111827; }
.page-desc { color: #6b7280; margin-top: 4px; font-size: 0.85rem; }
.inline-error { margin-top: 6px; color: #dc2626; font-size: 0.82rem; }
.btn { display: inline-flex; align-items: center; gap: 5px; border-radius: 8px; padding: 8px 14px; font-size: 0.875rem; font-weight: 500; border: 1px solid #d1d5db; background: #fff; color: #374151; cursor: pointer; font-family: inherit; transition: background 0.12s; }
.btn:hover { background: #f9fafb; }
.btn-back { color: #6b7280; padding: 7px 12px; font-size: 0.82rem; margin-top: 2px; }
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
.detail-value { font-size: 0.95rem; color: #111827; font-weight: 500; }
.detail-value.mono { font-family: monospace; letter-spacing: 0.04em; }
.tag-list { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 2px; }
.tag { font-size: 0.78rem; font-weight: 500; background: #f3f4f6; color: #374151; border-radius: 999px; padding: 3px 10px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 5px; font-size: 0.83rem; font-weight: 500; color: #374151; }
.field--full { grid-column: 1 / -1; }
.input { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 12px; font-size: 0.875rem; font-family: inherit; background: #fff; color: #111827; outline: none; transition: border-color 0.12s; }
.input:focus { border-color: #6366f1; }
.req { color: #ef4444; }
.field-error { font-size: 0.75rem; color: #ef4444; }
.id-display { display: flex; align-items: center; gap: 8px; padding: 7px 10px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; }
.id-badge { font-size: 0.875rem; font-weight: 600; color: #374151; font-family: monospace; letter-spacing: 0.05em; }
.id-hint { font-size: 0.75rem; color: #9ca3af; }
.checkbox-row { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 2px; }
.checkbox-item { display: flex; align-items: center; gap: 5px; font-size: 0.85rem; cursor: pointer; color: #374151; }
.not-found { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 60px 0; color: #9ca3af; }
.not-found-text { font-size: 1rem; }
</style>
