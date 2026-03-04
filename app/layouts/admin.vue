<template>
  <div class="admin-shell">
    <AdminAppSidebar :collapsed="sidebarCollapsed" @toggle="sidebarCollapsed = !sidebarCollapsed" />

    <div class="admin-body" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <AdminAppTopbar @toggle-sidebar="sidebarCollapsed = !sidebarCollapsed" />

      <main class="admin-main">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const sidebarCollapsed = ref(false)
</script>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body {
  font-family: 'Segoe UI', 'Noto Sans Thai', sans-serif;
  font-size: 15px;
  color: #1a202c;
  background: #f7f8fa;
}

a {
  color: inherit;
  text-decoration: none;
}

button {
  font-family: inherit;
  cursor: pointer;
}
</style>

<style scoped>
.admin-shell {
  display: flex;
  min-height: 100vh;
}

.admin-body {
  flex: 1;
  margin-left: 240px;
  display: flex;
  flex-direction: column;
  min-width: 0;
  transition: margin-left 0.2s ease;
}

.admin-body.sidebar-collapsed {
  margin-left: 64px;
}

.admin-main {
  padding: 28px 32px;
  flex: 1;
}

@media (max-width: 900px) {
  .admin-body {
    margin-left: 0;
  }
}
</style>
