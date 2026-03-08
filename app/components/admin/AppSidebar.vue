<template>
  <aside class="sidebar" :class="{ collapsed }">
    <!-- Logo -->
    <div class="sidebar-header">
      <div class="logo-mark">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 2L3 6v8l7 4 7-4V6L10 2z" fill="#fff" fill-opacity=".9" />
        </svg>
      </div>
      <Transition name="fade">
        <div v-if="!collapsed" class="logo-text">
          <span class="logo-title">EduFlow</span>
          <span class="logo-sub">Admin Console</span>
        </div>
      </Transition>
    </div>

    <!-- School tag -->
    <Transition name="fade">
      <div v-if="!collapsed" class="school-tag">
        <span class="online-dot" />
        <span class="school-name">{{ schoolDisplay }}</span>
      </div>
    </Transition>

    <!-- Nav -->
    <nav class="nav">
      <template v-for="group in activeNavGroups" :key="group.id">
        <!-- ── COLLAPSED MODE: icon-only list ── -->
        <template v-if="collapsed">
          <div class="collapsed-group">
            <NuxtLink
              v-for="item in group.items"
              :key="item.path"
              :to="item.path"
              class="nav-item nav-item--icon"
              active-class="nav-item--active"
              :title="item.label"
            >
              <span class="item-icon" v-html="item.icon" />
            </NuxtLink>
          </div>
        </template>

        <!-- ── EXPANDED MODE: accordion group ── -->
        <template v-else>
          <div class="nav-group">
            <!-- Group header / toggle button -->
            <button
              type="button"
              class="group-header"
              :class="{ 'group-header--open': openGroups.has(group.id) }"
              @click="toggleGroup(group.id)"
            >
              <span class="group-label">{{ group.label }}</span>
              <span class="group-chevron" :class="{ 'group-chevron--open': openGroups.has(group.id) }">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
            </button>

            <!-- Accordion items -->
            <div class="group-items" :class="{ 'group-items--open': openGroups.has(group.id) }">
              <NuxtLink
                v-for="item in group.items"
                :key="item.path"
                :to="item.path"
                class="nav-item"
                active-class="nav-item--active"
              >
                <span class="item-icon" v-html="item.icon" />
                <span class="item-label">{{ item.label }}</span>
              </NuxtLink>
            </div>
          </div>
        </template>
      </template>
    </nav>

    <!-- Footer user -->
    <div class="sidebar-footer">
      <div class="user-row">
        <div class="avatar">{{ avatarText }}</div>
        <Transition name="fade">
          <div v-if="!collapsed" class="user-info">
            <span class="user-name">{{ displayName }}</span>
            <span class="user-role">{{ displayRole }}</span>
          </div>
        </Transition>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

defineProps<{ collapsed: boolean }>()
defineEmits<{ (e: 'toggle'): void }>()

const route = useRoute()
const { avatarText, displayName, displayRole, schoolDisplay, isSuperAdmin } = useAdminAuth()

const ICON_DASHBOARD = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" fill-opacity=".8"/><rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" fill-opacity=".8"/><rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" fill-opacity=".8"/><rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" fill-opacity=".8"/></svg>`
const ICON_SCHOOL = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 7.5L8 3l6 4.5V14H2V7.5z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" fill="none"/><rect x="5.5" y="10" width="5" height="4" rx="0.5" stroke="currentColor" stroke-width="1.4" fill="none"/></svg>`
const ICON_PERSON = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="currentColor" stroke-width="1.4" fill="none"/><path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" fill="none"/></svg>`
const ICON_TEACHER = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2l1.5 3H13l-2.5 2 1 3L8 8.5 4.5 10l1-3L3 5h3.5L8 2z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" fill="none"/></svg>`
const ICON_STUDENT = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3L14 6l-6 3-6-3 6-3z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" fill="none"/><path d="M4 7.5v3.5c0 0 1.5 1.5 4 1.5s4-1.5 4-1.5V7.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`
const ICON_CLASSROOM = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" stroke-width="1.4" fill="none"/><path d="M1 6h14" stroke="currentColor" stroke-width="1.2"/><path d="M5 3V2M11 3V2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M4 9.5h3M9 9.5h3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`
const ICON_APPROVE = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.4" fill="none"/><path d="M5 8l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
const ICON_ROLES = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2l2 4h4l-3 2.5 1 4L8 10l-4 2.5 1-4L2 6h4l2-4z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" fill="none"/></svg>`
const ICON_DEPARTMENT = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="6" y="1" width="4" height="3" rx="0.8" stroke="currentColor" stroke-width="1.3" fill="none"/><rect x="1" y="8" width="4" height="3" rx="0.8" stroke="currentColor" stroke-width="1.3" fill="none"/><rect x="6" y="8" width="4" height="3" rx="0.8" stroke="currentColor" stroke-width="1.3" fill="none"/><rect x="11" y="8" width="4" height="3" rx="0.8" stroke="currentColor" stroke-width="1.3" fill="none"/><path d="M8 4v2M3 8V7H13V8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`
const ICON_SUBJECT_GROUP = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 3h9a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" fill="none"/><path d="M2 3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" fill="none"/><path d="M5 6h5M5 9h3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M13 5l1.5 1.5L13 8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`
const ICON_SUBJECT_SUBGROUP = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 2h7a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke="currentColor" stroke-width="1.3" fill="none"/><path d="M5 6h4M5 8.5h3M5 11h2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M12 5l2 2-2 2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`
const ICON_COURSE = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 2h8a1 1 0 0 1 1 1v11l-4.5-2L3 14V3a1 1 0 0 1 1-1z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" fill="none"/><path d="M5.5 6h5M5.5 9h3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`
const ICON_TIMETABLE = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="11" rx="1.5" stroke="currentColor" stroke-width="1.3" fill="none"/><path d="M1 7h14M5 3V1M11 3V1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M4 10h2M7 10h2M10 10h2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`
const ICON_GRADES = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 12l3-4 3 2 3-5 3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M1 14h14" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`
const ICON_ATTENDANCE = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="12" rx="1.5" stroke="currentColor" stroke-width="1.3" fill="none"/><path d="M5 7l2 2 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M1 6h14" stroke="currentColor" stroke-width="1.1"/></svg>`
const ICON_ANNOUNCE = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 5h9l3-2v9l-3-2H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linejoin="round"/><path d="M5 10v3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`
const ICON_BEHAVIOR = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="currentColor" stroke-width="1.3" fill="none"/><path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="M6 9.5l1.5 2 3-3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`
const ICON_CALENDAR = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="11" rx="1.5" stroke="currentColor" stroke-width="1.3" fill="none"/><path d="M1 7h14M5 3V1M11 3V1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="5.5" cy="10.5" r="0.8" fill="currentColor"/><circle cx="8" cy="10.5" r="0.8" fill="currentColor"/><circle cx="10.5" cy="10.5" r="0.8" fill="currentColor"/></svg>`
const ICON_REPORT = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="1" width="12" height="14" rx="1.5" stroke="currentColor" stroke-width="1.3" fill="none"/><path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`

const navGroups = [
  {
    id: 'overview',
    label: 'ภาพรวม',
    items: [
      { path: '/admin', label: 'แดชบอร์ด', icon: ICON_DASHBOARD },
    ],
  },
  {
    id: 'school',
    label: 'จัดการโรงเรียน',
    items: [
      { path: '/admin/schools', label: 'ข้อมูลโรงเรียน', icon: ICON_SCHOOL },
      { path: '/admin/classrooms', label: 'ห้องเรียน', icon: ICON_CLASSROOM },
      { path: '/admin/personnels', label: 'บุคลากร', icon: ICON_PERSON },
      { path: '/admin/teachers', label: 'ครู', icon: ICON_TEACHER },
      { path: '/admin/students', label: 'นักเรียน', icon: ICON_STUDENT },
    ],
  },
  {
    id: 'academic',
    label: 'วิชาการ',
    items: [
      { path: '/admin/courses', label: 'รายวิชา', icon: ICON_COURSE },
      { path: '/admin/timetable', label: 'ตารางสอน', icon: ICON_TIMETABLE },
      { path: '/admin/grades', label: 'ผลการเรียน', icon: ICON_GRADES },
      { path: '/admin/attendance', label: 'การเข้าเรียน', icon: ICON_ATTENDANCE },
    ],
  },
  {
    id: 'activities',
    label: 'ประกาศและกิจกรรม',
    items: [
      { path: '/admin/announcements', label: 'ประกาศ/ข่าวสาร', icon: ICON_ANNOUNCE },
      { path: '/admin/behavior', label: 'บันทึกพฤติกรรม', icon: ICON_BEHAVIOR },
      { path: '/admin/calendar', label: 'ปฏิทินการศึกษา', icon: ICON_CALENDAR },
    ],
  },
  {
    id: 'structure',
    label: 'โครงสร้างองค์กร',
    items: [
      { path: '/admin/departments', label: 'ฝ่ายงาน', icon: ICON_DEPARTMENT },
      { path: '/admin/subject-groups', label: 'กลุ่มสาระการเรียนรู้', icon: ICON_SUBJECT_GROUP },
      { path: '/admin/subject-subgroups', label: 'กลุ่มย่อยสาระการเรียนรู้', icon: ICON_SUBJECT_SUBGROUP },
    ],
  },
  {
    id: 'settings',
    label: 'การตั้งค่า',
    items: [
      { path: '/admin/approvals', label: 'คำขออนุมัติ', icon: ICON_APPROVE },
      { path: '/admin/roles', label: 'สิทธิ์และบทบาท', icon: ICON_ROLES },
      { path: '/admin/reports', label: 'รายงาน/Export', icon: ICON_REPORT },
    ],
  },
]

const superAdminNavGroups = [
  {
    id: 'platform',
    label: 'Platform Admin',
    items: [
      { path: '/admin/schools', label: 'จัดการโรงเรียน', icon: ICON_SCHOOL },
      { path: '/admin/personnels', label: 'สร้างแอดมินโรงเรียน', icon: ICON_PERSON },
    ],
  },
]

const activeNavGroups = computed(() => (isSuperAdmin.value ? superAdminNavGroups : navGroups))

// ── Accordion state ──
const openGroups = ref<Set<string>>(new Set())

function getActiveGroupId(path: string) {
  const found = activeNavGroups.value.find(g =>
    g.items.some(item => path === item.path || path.startsWith(`${item.path}/`)),
  )
  return found?.id ?? activeNavGroups.value[0]?.id ?? 'overview'
}

function toggleGroup(id: string) {
  const next = new Set(openGroups.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  openGroups.value = next
}

// Auto-open the group that owns the current route
function syncOpenGroup(path: string) {
  const id = getActiveGroupId(path)
  if (!openGroups.value.has(id)) {
    openGroups.value = new Set([...openGroups.value, id])
  }
}

syncOpenGroup(route.path)
watch(() => route.path, syncOpenGroup)
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 240px;
  background: #111827;
  display: flex;
  flex-direction: column;
  z-index: 100;
  transition: width 0.2s ease;
  overflow: hidden;
}

.sidebar.collapsed {
  width: 64px;
}

/* ── Header ── */
.sidebar-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 16px 14px;
  flex-shrink: 0;
}

.logo-mark {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo-title {
  display: block;
  font-weight: 700;
  font-size: 0.97rem;
  color: #f9fafb;
  white-space: nowrap;
  letter-spacing: -0.2px;
}

.logo-sub {
  display: block;
  font-size: 0.73rem;
  color: #6b7280;
  white-space: nowrap;
  margin-top: 1px;
}

/* ── School tag ── */
.school-tag {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 0 12px 6px;
  padding: 7px 10px;
  background: #1f2937;
  border-radius: 7px;
  flex-shrink: 0;
}

.online-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4ade80;
  flex-shrink: 0;
}

.school-name {
  font-size: 0.78rem;
  color: #9ca3af;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Nav ── */
.nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 8px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #374151 transparent;
}

/* ── Collapsed icon groups ── */
.collapsed-group {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding-bottom: 6px;
  border-bottom: 1px solid #1f2937;
  margin-bottom: 2px;
}

.collapsed-group:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

/* ── Accordion group ── */
.nav-group {
  display: flex;
  flex-direction: column;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 6px 10px;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 7px;
  font-family: inherit;
  transition: background 0.12s;
  margin-top: 4px;
}

.group-header:hover {
  background: #1a2233;
}

.group-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #9ca3af;
  letter-spacing: 0.01em;
  text-transform: none;
  white-space: nowrap;
  flex: 1;
  text-align: left;
  transition: color 0.12s;
}

.group-header:hover .group-label,
.group-header--open .group-label {
  color: #d1d5db;
}

.group-chevron {
  color: #6b7280;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  transition: transform 0.2s ease, color 0.12s;
}

.group-chevron:not(.group-chevron--open) {
  transform: rotate(-90deg);
}

.group-chevron--open {
  transform: rotate(0deg);
  color: #d1d5db;
}

/* Accordion items — max-height approach */
.group-items {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.25s ease;
}

.group-items--open {
  max-height: 400px;
}

/* ── Nav items ── */
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px 7px 14px;
  border-radius: 7px;
  color: #9ca3af;
  font-size: 0.855rem;
  font-weight: 500;
  transition: background 0.12s, color 0.12s;
  white-space: nowrap;
  text-decoration: none;
  position: relative;
}

.nav-item::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 50%;
  transform: translateY(-50%);
  width: 2px;
  height: 14px;
  border-radius: 2px;
  background: transparent;
  transition: background 0.12s;
}

.nav-item:hover {
  background: rgba(255,255,255,.04);
  color: #e5e7eb;
}

.nav-item--active {
  background: rgba(99,102,241,.15) !important;
  color: #a5b4fc !important;
  font-weight: 600;
  border-right: 3px solid #6366f1;
}

.nav-item--active::before {
  background: transparent;
}

.nav-item--icon {
  justify-content: center;
  padding: 10px;
}

.nav-item--icon::before {
  display: none;
}

.item-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  color: inherit;
}

.item-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Footer ── */
.sidebar-footer {
  padding: 12px 10px;
  border-top: 1px solid #1f2937;
  flex-shrink: 0;
}

.user-row {
  display: flex;
  align-items: center;
  gap: 9px;
}

.avatar {
  width: 32px;
  height: 32px;
  background: #374151;
  color: #d1d5db;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.user-name {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #e5e7eb;
  white-space: nowrap;
}

.user-role {
  display: block;
  font-size: 0.73rem;
  color: #6b7280;
  white-space: nowrap;
}

/* ── Fade transition ── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.12s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
