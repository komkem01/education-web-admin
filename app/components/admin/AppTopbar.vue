<template>
  <header class="topbar">
    <button type="button" class="menu-btn" @click="$emit('toggle-sidebar')" aria-label="เมนู">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M2 4h14M2 9h14M2 14h9" stroke="#374151" stroke-width="1.6" stroke-linecap="round" />
      </svg>
    </button>

    <div class="breadcrumb">
      <span class="page-title">{{ title }}</span>
    </div>

    <div class="topbar-right">
      <button type="button" class="notif-btn" aria-label="การแจ้งเตือน">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 2a5.5 5.5 0 0 1 5.5 5.5c0 2.5.8 3.8 1.5 4.5H2c.7-.7 1.5-2 1.5-4.5A5.5 5.5 0 0 1 9 2z" stroke="#6b7280" stroke-width="1.4" fill="none" />
          <path d="M7.5 15.5a1.5 1.5 0 0 0 3 0" stroke="#6b7280" stroke-width="1.4" stroke-linecap="round" fill="none" />
        </svg>
        <span class="notif-dot" />
      </button>

      <div class="divider" />

      <div class="user-chip">
        <div class="user-avatar">ส</div>
        <div class="user-detail">
          <span class="user-name">สมชาย มั่นคง</span>
          <span class="user-role">แอดมิน</span>
        </div>

        <button type="button" class="logout-btn" @click="logout" title="ออกจากระบบ">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10.5 5.5L13 8l-2.5 2.5M13 8H6.5" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M6.5 3H3.5A1 1 0 0 0 2.5 4v8a1 1 0 0 0 1 1h3" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

defineEmits<{ (e: 'toggle-sidebar'): void }>()

const route = useRoute()
const authToken = useCookie<string | null>('edu_auth_token')
const roleCookie = useCookie<string | null>('edu_active_role')

const titleMap: Record<string, string> = {
  '/admin': 'ภาพรวมระบบ',
  '/admin/school': 'จัดการข้อมูลโรงเรียน',
  '/admin/personnel': 'บุคลากร',
  '/admin/teachers': 'ครู',
  '/admin/students': 'นักเรียน',
  '/admin/approvals': 'อนุมัติคำขอ',
  '/admin/roles': 'Role Matrix',
}

const title = computed(() => titleMap[route.path] ?? 'แผงควบคุม')

if (roleCookie.value !== 'admin') {
  roleCookie.value = 'admin'
}

const logout = async () => {
  authToken.value = null
  roleCookie.value = null
  await navigateTo('/')
}
</script>

<style scoped>
.topbar {
  height: 56px;
  background: #ffffff;
  border-bottom: 1px solid #f1f3f4;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 50;
}

.menu-btn {
  background: none;
  border: none;
  padding: 6px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #374151;
  transition: background 0.12s;
}

.menu-btn:hover {
  background: #f3f4f6;
}

.breadcrumb {
  flex: 1;
}

.page-title {
  font-size: 0.97rem;
  font-weight: 600;
  color: #111827;
  letter-spacing: -0.1px;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.notif-btn {
  position: relative;
  background: none;
  border: none;
  padding: 7px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background 0.12s;
}

.notif-btn:hover {
  background: #f3f4f6;
}

.notif-dot {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 7px;
  height: 7px;
  background: #ef4444;
  border-radius: 50%;
  border: 1.5px solid #fff;
}

.divider {
  width: 1px;
  height: 24px;
  background: #e5e7eb;
  margin: 0 4px;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  width: 30px;
  height: 30px;
  background: #111827;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.user-detail {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 0.83rem;
  font-weight: 600;
  color: #111827;
  line-height: 1.2;
}

.user-role {
  font-size: 0.72rem;
  color: #9ca3af;
  line-height: 1.2;
}

.logout-btn {
  background: none;
  border: none;
  padding: 6px;
  border-radius: 7px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background 0.12s;
}

.logout-btn:hover {
  background: #fef2f2;
}

.logout-btn:hover svg path {
  stroke: #ef4444;
}
</style>
