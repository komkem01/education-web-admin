<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading" :rows="4" :cols="2" />
    <template v-else>
      <!-- Not found -->
      <div v-if="!record" class="not-found">
        <p class="not-found-text">ไม่พบข้อมูลห้องเรียน</p>
        <button class="btn btn-primary" @click="navigateTo('/admin/classrooms')">← กลับรายการ</button>
      </div>

      <template v-else>
        <!-- Header -->
        <div class="page-header">
          <div class="header-left">
            <button class="btn btn-back" @click="navigateTo('/admin/classrooms')">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7 2L3 6l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              กลับ
            </button>
            <div>
              <h2 class="page-title">{{ record.name }}</h2>
              <p class="page-desc">ห้องเรียน · {{ record.grade }} · ปีการศึกษา {{ record.year }}</p>
            </div>
          </div>
          <div class="header-actions">
            <button class="btn btn-edit" @click="openEdit">แก้ไข</button>
            <button class="btn btn-danger" @click="showConfirm = true">ลบ</button>
          </div>
        </div>

        <!-- Detail card -->
        <div class="detail-card">
          <p class="section-title">ข้อมูลห้องเรียน</p>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">ชื่อห้องเรียน</span>
              <span class="detail-value">{{ record.name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">ระดับชั้น</span>
              <span class="detail-value">{{ record.grade }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">ปีการศึกษา</span>
              <span class="detail-value">{{ record.year }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">ครูประจำชั้น</span>
              <span class="detail-value">{{ record.teacher || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">จำนวนนักเรียน</span>
              <span class="detail-value">{{ record.studentCount }} คน</span>
            </div>
            <div class="detail-item detail-item--full">
              <span class="detail-label">หมายเหตุ</span>
              <span class="detail-value">{{ record.note || '—' }}</span>
            </div>
          </div>
        </div>
      </template>

      <!-- Edit Modal -->
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
            <label class="form-label">ระดับชั้น <span class="req">*</span></label>
            <select v-model="form.grade" class="form-input">
              <option value="">— เลือก —</option>
              <option v-for="g in ['ม.1','ม.2','ม.3','ม.4','ม.5','ม.6']" :key="g" :value="g">{{ g }}</option>
            </select>
            <span v-if="formErrors.grade" class="field-error">{{ formErrors.grade }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">ปีการศึกษา <span class="req">*</span></label>
            <select v-model="form.year" class="form-input">
              <option value="">— เลือก —</option>
              <option value="2568">2568</option>
              <option value="2567">2567</option>
            </select>
            <span v-if="formErrors.year" class="field-error">{{ formErrors.year }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">ครูประจำชั้น</label>
            <input v-model="form.teacher" class="form-input" list="teacher-sugg-detail" placeholder="ชื่อครูประจำชั้น" autocomplete="off" />
            <datalist id="teacher-sugg-detail">
              <option v-for="t in uniqueTeachers" :key="t" :value="t" />
            </datalist>
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">จำนวนนักเรียน</label>
            <input v-model.number="form.studentCount" type="number" min="0" class="form-input" placeholder="0" />
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">หมายเหตุ</label>
            <textarea v-model="form.note" class="form-input form-textarea" placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)" />
          </div>
        </div>
      </AdminAppModal>

      <!-- Confirm Delete -->
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
import { ref, computed } from 'vue'
import { useClassroomsData, type ClassroomRow } from '~/composables/useClassroomsData'

definePageMeta({ layout: 'admin' })

const { loading } = usePageLoad()
const route = useRoute()
const { rows } = useClassroomsData()

const id = computed(() => String(route.params.id ?? ''))
const record = computed(() => rows.value.find(r => String(r.id) === id.value) ?? null)
const uniqueTeachers = computed(() => [...new Set(rows.value.map(r => r.teacher).filter(Boolean))])

// ── Edit ──
const showModal = ref(false)
const form = ref<ClassroomRow>({ id: 0, name: '', grade: '', year: '2568', teacher: '', studentCount: 0, note: '' })
const formErrors = ref({ name: '', grade: '', year: '' })

function openEdit() {
  if (!record.value) return
  form.value = { ...record.value }
  formErrors.value = { name: '', grade: '', year: '' }
  showModal.value = true
}

function validate() {
  formErrors.value = { name: '', grade: '', year: '' }
  if (!form.value.name.trim()) formErrors.value.name = 'กรุณาระบุชื่อห้อง'
  if (!form.value.grade) formErrors.value.grade = 'กรุณาเลือกระดับชั้น'
  if (!form.value.year) formErrors.value.year = 'กรุณาเลือกปีการศึกษา'
  return !formErrors.value.name && !formErrors.value.grade && !formErrors.value.year
}

function saveRow() {
  if (!validate() || !record.value) return
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
.btn { display: inline-flex; align-items: center; gap: 5px; border-radius: 8px; padding: 8px 14px; font-size: 0.875rem; font-weight: 500; border: 1px solid #d1d5db; background: #fff; color: #374151; cursor: pointer; font-family: inherit; transition: background 0.12s; }
.btn:hover { background: #f9fafb; }
.btn-back { color: #6b7280; padding: 7px 12px; font-size: 0.82rem; margin-top: 2px; }
.btn-back:hover { color: #374151; }
.btn-primary { background: #111827; color: #fff; border-color: #111827; }
.btn-primary:hover { background: #1f2937; }
.btn-edit { border-color: #d1d5db; background: #f9fafb; }
.btn-edit:hover { background: #f3f4f6; }
.btn-danger { border-color: #fecaca; background: #fef2f2; color: #b91c1c; }
.btn-danger:hover { background: #fee2e2; }
.detail-card { background: #fff; border: 1px solid #e8eaed; border-radius: 14px; padding: 24px; }
.section-title { font-size: 0.78rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 18px; padding-bottom: 10px; border-bottom: 1px solid #f3f4f6; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px 32px; }
.detail-item { display: flex; flex-direction: column; gap: 5px; }
.detail-item--full { grid-column: 1 / -1; }
.detail-label { font-size: 0.72rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
.detail-value { font-size: 0.95rem; color: #111827; font-weight: 500; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-group { display: flex; flex-direction: column; gap: 5px; }
.form-group--full { grid-column: 1 / -1; }
.form-label { font-size: 0.82rem; font-weight: 500; color: #374151; }
.req { color: #ef4444; }
.form-input { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 12px; font-size: 0.875rem; font-family: inherit; background: #fff; color: #111827; outline: none; transition: border-color 0.12s; width: 100%; box-sizing: border-box; }
.form-input:focus { border-color: #6366f1; }
.form-textarea { min-height: 72px; resize: vertical; }
.field-error { font-size: 0.75rem; color: #ef4444; }
.not-found { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 60px 0; color: #9ca3af; }
.not-found-text { font-size: 1rem; }
</style>
