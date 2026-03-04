<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading" :rows="4" :cols="2" />
    <template v-else>
      <div v-if="!record" class="not-found">
        <p class="not-found-text">ไม่พบข้อมูลบุคลากร</p>
        <button class="btn btn-primary" @click="navigateTo('/admin/personnels')">← กลับรายการ</button>
      </div>

      <template v-else>
        <!-- Header -->
        <div class="page-header">
          <div class="header-left">
            <button class="btn btn-back" @click="navigateTo('/admin/personnels')">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7 2L3 6l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              กลับ
            </button>
            <div>
              <h2 class="page-title">{{ record.name }}</h2>
              <p class="page-desc">{{ record.dept }} · รหัส {{ record.id }}</p>
            </div>
          </div>
          <div class="header-actions">
            <AdminStatusBadge :label="record.status" :variant="record.status === 'ใช้งาน' ? 'approved' : 'default'" />
            <button class="btn btn-edit" @click="openEdit">แก้ไข</button>
            <button class="btn btn-danger" @click="showConfirm = true">ลบ</button>
          </div>
        </div>

        <!-- Detail card -->
        <div class="detail-card">
          <p class="section-title">ข้อมูลบุคลากร</p>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">รหัสประจำตัว</span>
              <span class="detail-value mono">{{ record.id }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">สถานะ</span>
              <span class="detail-value">
                <AdminStatusBadge :label="record.status" :variant="record.status === 'ใช้งาน' ? 'approved' : 'default'" />
              </span>
            </div>
            <div class="detail-item detail-item--full">
              <span class="detail-label">ชื่อ-นามสกุล</span>
              <span class="detail-value">{{ record.name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">ฝ่ายงาน</span>
              <span class="detail-value">{{ record.dept }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">เบอร์โทร</span>
              <span class="detail-value">{{ record.phone || '—' }}</span>
            </div>
            <div class="detail-item detail-item--full">
              <span class="detail-label">บทบาทในระบบ</span>
              <div class="tag-list">
                <span v-for="r in record.roles" :key="r" class="tag">{{ r }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Edit Modal -->
      <AdminAppModal v-model="showModal" title="แก้ไขข้อมูลบุคลากร" size="md" confirm-label="บันทึก" @confirm="saveRow">
        <div class="form-grid">
          <label class="field field--full">
            <span>รหัสประจำตัว</span>
            <div class="id-display">
              <span class="id-badge">{{ form.id }}</span>
              <span class="id-hint">รหัสประจำตัวไม่สามารถแก้ไขได้</span>
            </div>
          </label>
          <label class="field field--full">
            <span>ชื่อ-นามสกุล <span class="req">*</span></span>
            <input v-model="form.name" class="input" type="text" placeholder="นาย/นาง/นางสาว..." />
            <span v-if="formErrors.name" class="field-error">{{ formErrors.name }}</span>
          </label>
          <label class="field">
            <span>ฝ่ายงาน</span>
            <select v-model="form.dept" class="input">
              <option>ฝ่ายวิชาการ</option>
              <option>ฝ่ายทะเบียน</option>
              <option>ฝ่ายพัสดุ</option>
              <option>ฝ่ายปกครอง</option>
            </select>
          </label>
          <label class="field">
            <span>เบอร์โทร</span>
            <input v-model="form.phone" class="input" type="text" placeholder="08x-xxx-xxxx" />
          </label>
          <label class="field field--full">
            <span>บทบาทในระบบ</span>
            <div class="checkbox-row">
              <label v-for="r in roleOptions" :key="r" class="checkbox-item">
                <input type="checkbox" :value="r" :checked="form.roles.includes(r)" @change="toggleRole(r)" />
                {{ r }}
              </label>
            </div>
          </label>
          <label class="field">
            <span>สถานะ</span>
            <select v-model="form.status" class="input">
              <option>ใช้งาน</option>
              <option>ไม่ใช้งาน</option>
            </select>
          </label>
        </div>
      </AdminAppModal>

      <!-- Confirm Delete -->
      <AdminAppConfirmModal
        v-model="showConfirm"
        :description="`ต้องการลบ '${record?.name}' ออกจากระบบหรือไม่?`"
        @confirm="confirmDelete"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePersonnelsData, type PersonnelRow } from '~/composables/usePersonnelsData'

definePageMeta({ layout: 'admin' })

const { loading } = usePageLoad()
const route = useRoute()
const { rows } = usePersonnelsData()

const id = computed(() => decodeURIComponent(String(route.params.id ?? '')))
const record = computed(() => rows.value.find(r => r.id === id.value) ?? null)

const roleOptions = ['บุคลากร', 'ครู', 'แอดมิน', 'ฝ่ายวิชาการ', 'ฝ่ายทะเบียน']

// ── Edit ──
const showModal = ref(false)
const form = ref<PersonnelRow>({ id: '', name: '', dept: 'ฝ่ายวิชาการ', roles: ['บุคลากร'], phone: '', status: 'ใช้งาน' })
const formErrors = ref({ name: '' })

function openEdit() {
  if (!record.value) return
  form.value = { ...record.value, roles: [...record.value.roles] }
  formErrors.value = { name: '' }
  showModal.value = true
}

function toggleRole(role: string) {
  const idx = form.value.roles.indexOf(role)
  if (idx >= 0) form.value.roles.splice(idx, 1)
  else form.value.roles.push(role)
}

function saveRow() {
  formErrors.value = { name: '' }
  if (!form.value.name.trim()) { formErrors.value.name = 'กรุณาระบุชื่อ-นามสกุล'; return }
  if (!record.value) return
  const idx = rows.value.findIndex(r => r.id === record.value!.id)
  if (idx !== -1) rows.value[idx] = { ...form.value }
  showModal.value = false
}

// ── Delete ──
const showConfirm = ref(false)

function confirmDelete() {
  if (!record.value) return
  rows.value = rows.value.filter(r => r.id !== record.value!.id)
  showConfirm.value = false
  navigateTo('/admin/personnels')
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 22px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.header-left { display: flex; align-items: flex-start; gap: 12px; }
.header-actions { display: flex; gap: 8px; align-items: center; }
.page-title { font-size: 1.3rem; font-weight: 700; margin: 0; color: #111827; }
.page-desc { color: #6b7280; margin-top: 4px; font-size: 0.85rem; }
.btn { display: inline-flex; align-items: center; gap: 5px; border-radius: 8px; padding: 8px 14px; font-size: 0.875rem; font-weight: 500; border: 1px solid #d1d5db; background: #fff; color: #374151; cursor: pointer; font-family: inherit; transition: background 0.12s; }
.btn:hover { background: #f9fafb; }
.btn-back { color: #6b7280; padding: 7px 12px; font-size: 0.82rem; margin-top: 2px; }
.btn-primary { background: #111827; color: #fff; border-color: #111827; }
.btn-edit { border-color: #d1d5db; background: #f9fafb; }
.btn-danger { border-color: #fecaca; background: #fef2f2; color: #b91c1c; }
.btn-danger:hover { background: #fee2e2; }
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
