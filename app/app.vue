<template>
  <div class="app-shell">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
}

html,
body,
#__nuxt {
  margin: 0;
  min-height: 100%;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #f4f5f7;
  color: #1f2937;
}

.app-shell {
  min-height: 100vh;
}

/* Unified dropdown style across admin pages */
select.filter-select,
select.form-input,
select.input,
select.page-size-select {
  min-height: 38px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 8px 36px 8px 12px;
  font-size: 0.875rem;
  line-height: 1.2;
  color: #111827;
  background-color: #ffffff;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%236B7280' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  appearance: none;
  outline: none;
  transition: border-color 0.12s, box-shadow 0.12s;
}

select.filter-select:hover,
select.form-input:hover,
select.input:hover,
select.page-size-select:hover {
  border-color: #9ca3af;
}

select.filter-select:focus,
select.form-input:focus,
select.input:focus,
select.page-size-select:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

select.filter-select:disabled,
select.form-input:disabled,
select.input:disabled,
select.page-size-select:disabled {
  background-color: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}
</style>
