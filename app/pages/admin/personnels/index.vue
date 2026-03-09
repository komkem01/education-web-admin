<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading" :rows="4" :cols="6" />
    <template v-else>
      <div class="page-header">
        <div>
          <h2 class="page-title">บุคลากร</h2>
          <p class="page-desc">จัดการข้อมูลบุคลากรในโรงเรียน (Admin/Staff)</p>
          <p v-if="errorMessage" class="inline-error">{{ errorMessage }}</p>
          <p v-if="pageLoading" class="inline-loading">กำลังโหลดข้อมูลบุคลากร...</p>
        </div>
        <button type="button" class="btn btn-primary" @click="openAdd">+ เพิ่มบุคลากร</button>
      </div>

      <div class="filter-row">
        <select v-model="filterMemberId" class="filter-select">
          <option value="">บุคลากรทั้งหมด</option>
          <option v-for="r in rows" :key="r.memberId" :value="r.memberId">{{ r.personnelCode }} - {{ r.name }}</option>
        </select>
        <select v-model="filterDept" class="filter-select">
          <option value="">ฝ่ายงานทั้งหมด</option>
          <option v-for="opt in deptFilterOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <button v-if="filterMemberId || filterDept" type="button" class="btn btn-clear" @click="clearFilters">ล้างตัวกรอง</button>
      </div>

      <AdminDataTable title="รายชื่อบุคลากร" :columns="cols" :rows="filteredRows" :page-size="10">
        <template #cell-roles="{ value }">
          <div class="tag-list">
            <span v-for="r in (value as string[])" :key="r" class="tag">{{ roleLabel(r) }}</span>
          </div>
        </template>
        <template #cell-status="{ value }">
          <AdminStatusBadge :label="value as string" :variant="value === 'ใช้งาน' ? 'approved' : 'default'" />
        </template>
        <template #rowActions="{ row }">
          <div class="action-btns">
            <button type="button" class="btn btn-sm btn-detail" @click="openDetail(row as unknown as PersonnelRow)">รายละเอียด</button>
            <button type="button" class="btn btn-sm btn-edit" @click="openEdit(row as unknown as PersonnelRow)">แก้ไข</button>
            <button type="button" class="btn btn-sm btn-delete" @click="openDelete(row as unknown as PersonnelRow)">ลบ</button>
          </div>
        </template>
      </AdminDataTable>

      <AdminAppModal v-model="showModal" :title="editTarget ? 'แก้ไขข้อมูลบุคลากร' : 'เพิ่มบุคลากรใหม่'" size="md" confirm-label="บันทึก" @confirm="saveRow">
        <div class="form-grid">
          <label class="field field--full">
            <span>รหัสบุคลากร</span>
            <div class="id-display">
              <span class="id-badge">{{ form.personnelCode || 'ระบบจะสร้างให้อัตโนมัติ' }}</span>
              <span class="id-hint">{{ editTarget ? 'รหัสบุคลากรไม่สามารถแก้ไขได้' : 'จะสร้างหลังบันทึก' }}</span>
            </div>
          </label>

          <label v-if="!editTarget" class="field">
            <span>อีเมลผู้ใช้งาน <span class="req">*</span></span>
            <input v-model="form.email" class="input" type="email" placeholder="example@school.ac.th" />
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
            <span>ฝ่ายงาน</span>
            <select v-model="form.dept" class="input">
              <option value="">{{ deptOptions.length === 0 ? 'ยังไม่มีข้อมูลฝ่ายงาน' : 'เลือกฝ่ายงาน' }}</option>
              <option v-for="d in deptOptions" :key="d" :value="d">{{ d }}</option>
            </select>
            <span v-if="deptOptions.length === 0" class="field-hint">ยังไม่มีข้อมูลฝ่ายงาน กรุณาเพิ่มที่หน้า "ฝ่ายงาน" ก่อน</span>
          </label>

          <label class="field">
            <span>เบอร์โทร</span>
            <input v-model="form.phone" class="input" type="text" placeholder="08x-xxx-xxxx" />
          </label>

          <label class="field field--full">
            <span>บทบาทในระบบ</span>
            <div class="checkbox-row">
              <label v-for="r in roleOptionsForForm" :key="r.value" class="checkbox-item">
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
        :description="`ต้องการลบ '${deleteTarget?.name}' ออกจากระบบหรือไม่?`"
        @confirm="confirmDelete"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

definePageMeta({ layout: 'admin' })

const { loading } = usePageLoad()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('edu_auth_token')
const { profile, isSuperAdmin } = useAdminAuth()

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

type DepartmentApiItem = {
  id: string
  school_id: string
  code: string
  name: string
  head: string | null
  description: string | null
  is_active: boolean
}

type PersonnelRow = {
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

type PersonnelForm = {
  memberId: string
  personnelCode: string
  firstName: string
  lastName: string
  genderId: string
  prefixId: string
  dept: string
  phone: string
  status: string
  email: string
  password: string
  staffId: string
  adminId: string
}

const roleOptions = [
  { value: 'staff', label: 'บุคลากร (Staff)' },
  { value: 'admin', label: 'แอดมิน (Admin)' },
]

const createRoleOptions = [
  { value: 'admin', label: 'แอดมิน (Admin)' },
]

const rows = ref<PersonnelRow[]>([])
const pageLoading = ref(false)
const errorMessage = ref('')
const genderRows = ref<GenderItem[]>([])
const prefixRows = ref<PrefixItem[]>([])
const departmentRows = ref<DepartmentApiItem[]>([])

const cols = [
  { key: 'personnelCode', label: 'รหัสบุคลากร' },
  { key: 'name', label: 'ชื่อ-นามสกุล' },
  { key: 'gender', label: 'เพศ' },
  { key: 'prefix', label: 'คำนำหน้า' },
  { key: 'dept', label: 'ฝ่ายงาน' },
  { key: 'roles', label: 'บทบาทในระบบ' },
  { key: 'phone', label: 'เบอร์โทร' },
  { key: 'status', label: 'สถานะ' },
]

const filterMemberId = ref('')
const filterDept = ref('')

const deptOptions = computed(() =>
  departmentRows.value
    .filter(item => item.is_active)
    .map(item => item.name)
    .filter(Boolean),
)
const deptFilterOptions = computed(() => deptOptions.value.map(d => ({ label: d, value: d })))
const statusOptions = [
  { label: 'ใช้งาน', value: 'ใช้งาน' },
  { label: 'ไม่ใช้งาน', value: 'ไม่ใช้งาน' },
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

const filteredRows = computed(() =>
  rows.value.filter((r) => {
    const matchMember = !filterMemberId.value || r.memberId === filterMemberId.value
    const matchDept = !filterDept.value || r.dept === filterDept.value
    return matchMember && matchDept
  }),
)

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

function clearFilters() {
  filterMemberId.value = ''
  filterDept.value = ''
}

async function loadRows() {
  if (!import.meta.client || !authToken.value) return

  const schoolId = profile.value.schoolId
  if (!schoolId) {
    errorMessage.value = 'ไม่พบ school_id ใน session'
    rows.value = []
    departmentRows.value = []
    return
  }

  pageLoading.value = true
  errorMessage.value = ''

  try {
    const [membersRes, staffsRes, adminsRes, gendersRes, prefixesRes, departmentsRes] = await Promise.all([
      apiFetch<BaseResponse<MemberItem[]>>('/members?only_active=false', { headers: authHeaders() }),
      apiFetch<BaseResponse<StaffItem[]>>('/staffs?only_active=false', { headers: authHeaders() }),
      apiFetch<BaseResponse<AdminItem[]>>('/admins?only_active=false', { headers: authHeaders() }),
      apiFetch<BaseResponse<GenderItem[]>>('/genders?only_active=false', { headers: authHeaders() }),
      apiFetch<BaseResponse<PrefixItem[]>>('/prefixes?only_active=false', { headers: authHeaders() }),
      apiFetch<BaseResponse<DepartmentApiItem[]>>(`/departments?school_id=${schoolId}&only_active=true`, { headers: authHeaders() }),
    ])

    const members = Array.isArray(membersRes.data) ? membersRes.data : []
    const staffs = Array.isArray(staffsRes.data) ? staffsRes.data : []
    const admins = Array.isArray(adminsRes.data) ? adminsRes.data : []
    genderRows.value = Array.isArray(gendersRes.data) ? gendersRes.data : []
    prefixRows.value = Array.isArray(prefixesRes.data) ? prefixesRes.data : []
    departmentRows.value = Array.isArray(departmentsRes.data) ? departmentsRes.data : []

    const genderNameByID = new Map(genderRows.value.map(item => [item.id, item.name] as const))
    const prefixNameByID = new Map(prefixRows.value.map(item => [item.id, item.name] as const))

    const staffByMember = new Map(staffs.map(item => [item.member_id, item] as const))
    const adminByMember = new Map(admins.map(item => [item.member_id, item] as const))

    const nextRows: PersonnelRow[] = []

    for (const member of members) {
      const staff = staffByMember.get(member.id)
      const admin = adminByMember.get(member.id)
      if (!staff && !admin) continue
      if (isSuperAdmin.value && !admin) continue

      const roles: string[] = []
      if (staff) roles.push('staff')
      if (admin) roles.push('admin')
      if (roles.length === 0 && (member.role === 'staff' || member.role === 'admin')) roles.push(member.role)
      if (isSuperAdmin.value) {
        roles.splice(0, roles.length, 'admin')
      }

      const name = fullName(staff?.first_name || admin?.first_name || null, staff?.last_name || admin?.last_name || null) || member.email
      const firstName = (staff?.first_name || admin?.first_name || '').trim()
      const lastName = (staff?.last_name || admin?.last_name || '').trim()
      const genderId = (staff?.gender_id || admin?.gender_id || '').trim()
      const prefixId = (staff?.prefix_id || admin?.prefix_id || '').trim()
      const dept = (staff?.department || '').trim()
      const phone = (staff?.phone || admin?.phone || '').trim()
      const active = Boolean((staff?.is_active ?? false) || (admin?.is_active ?? false))
      const personnelCode = (staff?.staff_code || '').trim() || (admin?.admin_code || '').trim() || '-'

      nextRows.push({
        memberId: member.id,
        personnelCode,
        firstName,
        lastName,
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
      })
    }

    rows.value = nextRows
  }
  catch {
    errorMessage.value = 'ไม่สามารถโหลดข้อมูลบุคลากรได้'
    rows.value = []
    departmentRows.value = []
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
const editTarget = ref<PersonnelRow | null>(null)
const deleteTarget = ref<PersonnelRow | null>(null)

const roleOptionsForForm = computed(() => {
  if (isSuperAdmin.value) return createRoleOptions
  if (editTarget.value) return roleOptions
  return roleOptions
})

const emptyForm = (): PersonnelForm => ({
  memberId: '',
  personnelCode: '',
  firstName: '',
  lastName: '',
  genderId: '',
  prefixId: '',
  dept: '',
  roles: [isSuperAdmin.value ? 'admin' : 'staff'],
  phone: '',
  status: 'ใช้งาน',
  email: '',
  password: '',
  staffId: '',
  adminId: '',
})

const form = ref<PersonnelForm>(emptyForm())
const formErrors = ref({ firstName: '', lastName: '', email: '', password: '', roles: '' })

function toggleRole(role: string) {
  const idx = form.value.roles.indexOf(role)
  if (idx >= 0) form.value.roles.splice(idx, 1)
  else form.value.roles.push(role)
}

function validate() {
  formErrors.value = { firstName: '', lastName: '', email: '', password: '', roles: '' }
  if (!form.value.firstName.trim()) formErrors.value.firstName = 'กรุณาระบุชื่อ'
  if (!form.value.lastName.trim()) formErrors.value.lastName = 'กรุณาระบุนามสกุล'
  if (!editTarget.value && !form.value.email.trim()) formErrors.value.email = 'กรุณาระบุอีเมล'
  if (!editTarget.value && form.value.password.trim().length < 6) formErrors.value.password = 'รหัสผ่านต้องอย่างน้อย 6 ตัวอักษร'
  if (form.value.roles.length === 0) formErrors.value.roles = 'กรุณาเลือกอย่างน้อย 1 บทบาท'
  return !formErrors.value.firstName && !formErrors.value.lastName && !formErrors.value.email && !formErrors.value.password && !formErrors.value.roles
}

function openAdd() {
  editTarget.value = null
  form.value = emptyForm()
  showModal.value = true
}

function openEdit(row: PersonnelRow) {
  editTarget.value = row
  form.value = {
    memberId: row.memberId,
    personnelCode: row.personnelCode,
    firstName: row.firstName,
    lastName: row.lastName,
    genderId: row.genderId,
    prefixId: row.prefixId,
    dept: row.dept,
    roles: isSuperAdmin.value ? ['admin'] : [...row.roles],
    phone: row.phone,
    status: row.status,
    email: row.email,
    password: '',
    staffId: row.staffId,
    adminId: row.adminId,
  }
  showModal.value = true
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
  if (!validate() || !authToken.value) return

  const schoolId = profile.value.schoolId
  if (!schoolId) {
    errorMessage.value = 'ไม่พบ school_id ใน session'
    return
  }

  const selectedRoles = isSuperAdmin.value
    ? ['admin']
    : [...new Set(form.value.roles.filter((r): r is PersonnelRole => r === 'admin' || r === 'staff'))]
  const active = form.value.status === 'ใช้งาน'
  const firstName = form.value.firstName.trim() || null
  const lastName = form.value.lastName.trim() || null

  try {
    let memberId = form.value.memberId

    if (!editTarget.value) {
      const primaryRole = selectedRoles.includes('staff') ? 'staff' : 'admin'
      const memberRes = await apiFetch<BaseResponse<MemberItem>>('/members', {
        method: 'POST',
        headers: authHeaders(),
        body: {
          school_id: schoolId,
          email: form.value.email.trim(),
          password: form.value.password.trim(),
          role: primaryRole,
          is_active: active,
        },
      })
      memberId = memberRes.data.id
    }

    await ensureRoleAssignments(memberId, selectedRoles)

    if (selectedRoles.includes('staff')) {
      const staffPayload = {
        member_id: memberId,
        gender_id: form.value.genderId || null,
        prefix_id: form.value.prefixId || null,
        first_name: firstName,
        last_name: lastName,
        phone: form.value.phone.trim() || null,
        department: form.value.dept.trim() || null,
        is_active: active,
      }
      if (form.value.staffId) {
        await apiFetch(`/staffs/${form.value.staffId}`, {
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
    else if (form.value.staffId) {
      await apiFetch(`/staffs/${form.value.staffId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
    }

    if (selectedRoles.includes('admin')) {
      const adminPayload = {
        member_id: memberId,
        gender_id: form.value.genderId || null,
        prefix_id: form.value.prefixId || null,
        first_name: firstName,
        last_name: lastName,
        phone: form.value.phone.trim() || null,
        is_active: active,
      }
      if (form.value.adminId) {
        await apiFetch(`/admins/${form.value.adminId}`, {
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
    else if (form.value.adminId) {
      await apiFetch(`/admins/${form.value.adminId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
    }

    showModal.value = false
    await loadRows()
  }
  catch {
    errorMessage.value = 'บันทึกข้อมูลบุคลากรไม่สำเร็จ'
  }
}

function openDetail(row: PersonnelRow) {
  navigateTo(`/admin/personnels/${encodeURIComponent(row.memberId)}`)
}

function openDelete(row: PersonnelRow) {
  deleteTarget.value = row
  showConfirm.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value || !authToken.value) {
    showConfirm.value = false
    return
  }

  const target = deleteTarget.value

  try {
    if (target.staffId) {
      await apiFetch(`/staffs/${target.staffId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      await apiFetch(`/members/${target.memberId}/roles/staff`, {
        method: 'DELETE',
        headers: authHeaders(),
      }).catch(() => {})
    }

    if (target.adminId) {
      await apiFetch(`/admins/${target.adminId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      await apiFetch(`/members/${target.memberId}/roles/admin`, {
        method: 'DELETE',
        headers: authHeaders(),
      }).catch(() => {})
    }

    showConfirm.value = false
    deleteTarget.value = null
    await loadRows()
  }
  catch {
    errorMessage.value = 'ลบข้อมูลบุคลากรไม่สำเร็จ'
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
.filter-select {
  min-width: 220px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 8px 36px 8px 12px;
  font-size: 0.875rem;
  font-family: inherit;
  color: #111827;
  background-color: #fff;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%236B7280' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  appearance: none;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.12s, box-shadow 0.12s;
}

.filter-select:hover {
  border-color: #9ca3af;
}

.filter-select:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.filter-select:disabled {
  background-color: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}
.search-wrap { position: relative; }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); pointer-events: none; }
.input { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 12px; font-size: 0.875rem; font-family: inherit; background: #fff; color: #111827; outline: none; transition: border-color 0.12s; }
.input:focus { border-color: #6366f1; }
select.input {
  padding-right: 36px;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%236B7280' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
}
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

.tag-list { display: flex; gap: 4px; flex-wrap: wrap; }
.tag { font-size: 0.72rem; font-weight: 500; background: #f3f4f6; color: #374151; border-radius: 999px; padding: 2px 8px; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 5px; font-size: 0.83rem; font-weight: 500; color: #374151; }
.field--full { grid-column: 1 / -1; }
.checkbox-row { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 2px; }
.checkbox-item { display: flex; align-items: center; gap: 5px; font-size: 0.85rem; cursor: pointer; color: #374151; }
.req { color: #ef4444; }
.field-error { font-size: 0.75rem; color: #ef4444; margin-top: 2px; }
.field-hint { font-size: 0.75rem; color: #6b7280; margin-top: 2px; }
.id-display { display: flex; align-items: center; gap: 8px; padding: 7px 10px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; }
.id-badge { font-size: 0.875rem; font-weight: 600; color: #374151; font-family: monospace; letter-spacing: 0.05em; }
.id-hint { font-size: 0.75rem; color: #9ca3af; }

@media (max-width: 760px) {
  .filter-select {
    width: 100%;
    min-width: 0;
  }
}
</style>
