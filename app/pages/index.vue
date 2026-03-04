<script setup lang="ts">
const username = ref('')
const password = ref('')
const errorMessage = ref('')

const authToken = useCookie<string | null>('edu_auth_token')
const activeRole = useCookie<string | null>('edu_active_role')

if (authToken.value) {
  await navigateTo('/admin')
}

const handleLogin = async () => {
  if (!username.value.trim() || !password.value.trim()) {
    errorMessage.value = 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน'
    return
  }

  authToken.value = 'mock-token'
  activeRole.value = 'admin'
  errorMessage.value = ''

  await navigateTo('/admin')
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="brand-row">
        <span class="brand-icon">E</span>
        <div>
          <h1>EduFlow</h1>
          <p>School Management Platform</p>
        </div>
      </div>

      <div class="intro">
        <h2>เข้าสู่ระบบ</h2>
        <p>กรุณาเข้าสู่ระบบเพื่อใช้งานในโรงเรียนของคุณ</p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <label>
          ชื่อผู้ใช้
          <input v-model="username" type="text" placeholder="เช่น admin.school01" />
        </label>

        <label>
          รหัสผ่าน
          <input v-model="password" type="password" placeholder="••••••••" />
        </label>

        <p class="role-fixed">สิทธิ์การใช้งาน: แอดมิน</p>

        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

        <button type="submit">เข้าสู่ระบบ</button>
      </form>

      <p class="helper-text">* โหมดตัวอย่าง: ผู้พัฒนาระบบเป็นผู้ลงทะเบียนบัญชีเริ่มต้นให้</p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #f4f5f7;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
  display: grid;
  gap: 18px;
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #111827;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.brand-row h1 {
  margin: 0;
  font-size: 1.1rem;
}

.brand-row p {
  margin: 2px 0 0;
  color: #6b7280;
  font-size: 0.82rem;
}

.intro h2 {
  margin: 0;
  font-size: 1.2rem;
}

.intro p {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.login-form {
  display: grid;
  gap: 12px;
}

.login-form label {
  display: grid;
  gap: 6px;
  font-size: 0.9rem;
  color: #374151;
}

.login-form input,
.login-form select {
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 10px 12px;
  font: inherit;
  color: #111827;
  background: #fff;
}

.role-fixed {
  margin: 0;
  font-size: 0.88rem;
  color: #4b5563;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px 12px;
}

.login-form button {
  margin-top: 4px;
  border: 1px solid #111827;
  background: #111827;
  color: #fff;
  border-radius: 10px;
  padding: 10px 12px;
  font-weight: 600;
}

.error-text {
  margin: 0;
  color: #b91c1c;
  font-size: 0.85rem;
}

.helper-text {
  margin: 0;
  color: #6b7280;
  font-size: 0.8rem;
}
</style>
