<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading" :rows="6" :cols="5" />
    <template v-else>
    <div class="page-header">
      <div>
        <h2 class="page-title">Role Matrix & การจัดการสิทธิ์</h2>
        <p class="page-desc">1 คนมีได้หลายบทบาท (ยกเว้นนักเรียน) · เลือก Switch Role ขณะใช้งาน</p>
      </div>
      <button type="button" class="btn btn-primary">+ มอบหมาย Role</button>
    </div>

    <!-- ── Role Permission Matrix ── -->
    <div class="card">
      <h3 class="card-title">ตารางสิทธิ์การใช้งาน (Role Permission Matrix)</h3>
      <div class="matrix-scroll">
        <table class="matrix-table">
          <thead>
            <tr>
              <th class="feature-col">ฟีเจอร์ / สิทธิ์</th>
              <th v-for="role in roles" :key="role">{{ role }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="feat in features" :key="feat.label">
              <td class="feat-name">{{ feat.label }}</td>
              <td v-for="role in roles" :key="role" class="perm-cell">
                <span v-if="feat.perms[role] === 'full'" class="perm perm-full" title="ทำได้ทันที">✓</span>
                <span v-else-if="feat.perms[role] === 'approve'" class="perm perm-approve" title="ต้องรออนุมัติ">⏳</span>
                <span v-else class="perm perm-none" title="ไม่มีสิทธิ์">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="legend">
        <span><span class="perm perm-full">✓</span> ทำได้ทันที</span>
        <span><span class="perm perm-approve">⏳</span> รออนุมัติจากบุคลากร</span>
        <span><span class="perm perm-none">—</span> ไม่มีสิทธิ์</span>
      </div>
    </div>

    <!-- ── Multi-role Users ── -->
    <AdminDataTable title="ผู้ใช้ที่มีหลายบทบาท" :columns="userCols" :rows="userRows">
      <template #cell-roles="{ value }">
        <div class="role-tags">
          <AdminStatusBadge v-for="r in (value as string[])" :key="r" :label="r" variant="info" />
        </div>
      </template>

      <template #cell-activeRole="{ value }">
        <AdminStatusBadge :label="value as string" variant="default" />
      </template>

      <template #rowActions>
        <div class="action-btns">
          <button type="button" class="btn-tiny">แก้ไข Role</button>
        </div>
      </template>
    </AdminDataTable>

    <!-- ── Role combination info ── -->
    <div class="card combo-card">
      <h3 class="card-title">การผสมบทบาทที่รองรับ</h3>
      <div class="combo-grid">
        <div v-for="combo in combos" :key="combo.a + combo.b" class="combo-item">
          <div class="combo-chips">
            <span class="chip">{{ combo.a }}</span>
            <span class="arrow">↔</span>
            <span class="chip">{{ combo.b }}</span>
          </div>
          <div class="combo-note">{{ combo.note }}</div>
        </div>
      </div>
    </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const { loading } = usePageLoad()

const roles = ['แอดมิน', 'บุคลากร', 'ครู', 'นักเรียน']

type Perm = 'full' | 'approve' | 'none'
interface Feature { label: string; perms: Record<string, Perm> }

const features: Feature[] = [
  { label: 'จัดการข้อมูลโรงเรียน', perms: { แอดมิน: 'full', บุคลากร: 'none', ครู: 'none', นักเรียน: 'none' } },
  { label: 'เพิ่ม/ลบ บุคลากร', perms: { แอดมิน: 'full', บุคลากร: 'none', ครู: 'none', นักเรียน: 'none' } },
  { label: 'เพิ่ม/ลบ ครู', perms: { แอดมิน: 'full', บุคลากร: 'full', ครู: 'none', นักเรียน: 'none' } },
  { label: 'เพิ่ม/ลบ นักเรียน', perms: { แอดมิน: 'full', บุคลากร: 'full', ครู: 'approve', นักเรียน: 'none' } },
  { label: 'จัดการผู้ปกครอง', perms: { แอดมิน: 'full', บุคลากร: 'full', ครู: 'none', นักเรียน: 'none' } },
  { label: 'อนุมัติคำขอ', perms: { แอดมิน: 'full', บุคลากร: 'full', ครู: 'none', นักเรียน: 'none' } },
  { label: 'เปิด/แก้ไข รายวิชา', perms: { แอดมิน: 'full', บุคลากร: 'full', ครู: 'approve', นักเรียน: 'none' } },
  { label: 'แก้ไขข้อมูลนักเรียน', perms: { แอดมิน: 'full', บุคลากร: 'full', ครู: 'approve', นักเรียน: 'none' } },
  { label: 'ขอเอกสาร', perms: { แอดมิน: 'full', บุคลากร: 'full', ครู: 'approve', นักเรียน: 'none' } },
  { label: 'แก้ไขข้อมูลส่วนตัว', perms: { แอดมิน: 'full', บุคลากร: 'full', ครู: 'approve', นักเรียน: 'none' } },
  { label: 'ดูตารางเรียน', perms: { แอดมิน: 'full', บุคลากร: 'full', ครู: 'full', นักเรียน: 'full' } },
  { label: 'ดูผลการเรียน', perms: { แอดมิน: 'full', บุคลากร: 'full', ครู: 'full', นักเรียน: 'full' } },
]

const userCols = [
  { key: 'name', label: 'ชื่อ' },
  { key: 'roles', label: 'บทบาทที่ได้รับ' },
  { key: 'activeRole', label: 'โหมดใช้งานปัจจุบัน' },
  { key: 'lastLogin', label: 'Login ล่าสุด' },
]

const userRows = [
  { name: 'นางสาวรุ่งนภา สุขใจ', roles: ['บุคลากร', 'แอดมิน'], activeRole: 'แอดมิน', lastLogin: '04/03/68 09:00' },
  { name: 'นางวิลาวัณย์ ดีมาก', roles: ['บุคลากร', 'ครู'], activeRole: 'ครู', lastLogin: '04/03/68 07:45' },
  { name: 'นายสมชาย ใจดี', roles: ['ครู', 'บุคลากร'], activeRole: 'ครู', lastLogin: '04/03/68 08:10' },
]

const combos = [
  { a: 'แอดมิน', b: 'บุคลากร', note: 'ดูแลระบบโรงเรียนพร้อมจัดการเอกสาร' },
  { a: 'แอดมิน', b: 'ครู', note: 'บริหารระบบพร้อมสอนนักเรียน' },
  { a: 'บุคลากร', b: 'ครู', note: 'สอนและอนุมัติคำขอได้ในคนเดียวกัน' },
]
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 20px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.page-title { font-size: 1.2rem; font-weight: 700; margin: 0; }
.page-desc { color: #6b7280; margin-top: 4px; font-size: 0.88rem; }
.btn { border-radius: 9px; padding: 8px 14px; font-size: 0.88rem; font-weight: 500; border: 1px solid #d1d5db; background: #fff; color: #111827; cursor: pointer; font-family: inherit; }
.btn-primary { background: #111827; color: #fff; border-color: #111827; }

.card { background: #fff; border: 1px solid #e8eaed; border-radius: 14px; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
.card-title { font-size: 1rem; font-weight: 600; margin: 0; }

.matrix-scroll { overflow-x: auto; }
.matrix-table { width: 100%; border-collapse: collapse; }
.matrix-table th, .matrix-table td { border: 1px solid #f1f3f4; padding: 9px 14px; text-align: center; font-size: 0.88rem; }
.matrix-table th { background: #fafafa; font-weight: 600; color: #374151; }
.feature-col { text-align: left !important; min-width: 200px; }
.feat-name { text-align: left !important; color: #111827; font-size: 0.88rem; }
.perm-cell { white-space: nowrap; }
.perm { display: inline-block; border-radius: 50%; width: 22px; height: 22px; line-height: 22px; font-size: 0.78rem; text-align: center; }
.perm-full { background: #f0fdf4; color: #15803d; }
.perm-approve { background: #fefce8; color: #92400e; }
.perm-none { color: #d1d5db; }
.legend { display: flex; gap: 18px; font-size: 0.82rem; color: #6b7280; flex-wrap: wrap; }
.legend span { display: flex; align-items: center; gap: 5px; }

.role-tags { display: flex; gap: 5px; flex-wrap: wrap; }
.action-btns { display: flex; gap: 6px; justify-content: flex-end; }
.btn-tiny { border-radius: 7px; padding: 4px 9px; font-size: 0.78rem; border: 1px solid #d1d5db; background: #f9fafb; color: #374151; cursor: pointer; font-family: inherit; }

.combo-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.combo-item { border: 1px solid #f1f3f4; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 8px; }
.combo-chips { display: flex; align-items: center; gap: 8px; }
.chip { background: #f3f4f6; border-radius: 7px; padding: 4px 10px; font-size: 0.85rem; font-weight: 500; }
.arrow { color: #9ca3af; font-size: 1rem; }
.combo-note { font-size: 0.82rem; color: #6b7280; line-height: 1.4; }

@media (max-width: 740px) { .combo-grid { grid-template-columns: 1fr; } }
</style>
