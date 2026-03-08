type AuthMeData = {
  member_id: string
  school_id: string
  role: string
  roles: string[]
  issued_at: string
  expires_at: string
}

type AuthMeResponse = {
  data: AuthMeData
}

type RefreshData = {
  access_token: string
  token_type: string
  expires_at: string
  role: string
  roles: string[]
}

type RefreshResponse = {
  data: RefreshData
}

type MemberDirectoryRow = {
  id: string
  member_id: string
  admin_code?: string | null
  staff_code?: string | null
  teacher_code?: string | null
  student_code?: string | null
  parent_code?: string | null
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
}

type MemberDirectoryResponse = {
  data: MemberDirectoryRow[]
}

type SchoolData = {
  id: string
  name: string
  logo_url?: string | null
  theme_color?: string | null
  address?: string
  description?: string | null
}

type SchoolResponse = {
  data: SchoolData
}

const roleEndpointMap: Record<string, string> = {
  admin: 'admins',
  staff: 'staffs',
  teacher: 'teachers',
  student: 'students',
  parent: 'parents',
}

function parseRoles(raw: string | null | undefined): string[] {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  }
  catch {
    return []
  }
}

function roleLabel(role: string | null | undefined): string {
  if (!role) return '-'

  const map: Record<string, string> = {
    admin: 'ผู้ดูแลระบบ',
    staff: 'เจ้าหน้าที่',
    teacher: 'ครู',
    student: 'นักเรียน',
    parent: 'ผู้ปกครอง',
  }

  return map[role] ?? role.toUpperCase()
}

export function useAdminAuth() {
  const config = useRuntimeConfig()
  const refreshTimer = useState<ReturnType<typeof setTimeout> | null>('edu_auth_refresh_timer', () => null)
  const refreshInFlight = useState<boolean>('edu_auth_refresh_in_flight', () => false)
  const autoRefreshStarted = useState<boolean>('edu_auth_auto_refresh_started', () => false)
  const authCookieKeys = [
    'edu_auth_token',
    'edu_active_role',
    'edu_auth_member_id',
    'edu_auth_school_id',
    'edu_auth_school_name',
    'edu_auth_role',
    'edu_auth_roles',
    'edu_auth_issued_at',
    'edu_auth_expires_at',
    'edu_auth_email',
    'edu_auth_admin_id',
    'edu_auth_member_code',
    'edu_auth_first_name',
    'edu_auth_last_name',
    'edu_auth_phone',
  ] as const

  const baseCookieOptions = {
    sameSite: 'lax' as const,
    secure: import.meta.env.PROD,
    path: '/',
    maxAge: 60 * 60 * 8,
  }

  const authToken = useCookie<string | null>('edu_auth_token', baseCookieOptions)
  const activeRole = useCookie<string | null>('edu_active_role', baseCookieOptions)
  const authMemberId = useCookie<string | null>('edu_auth_member_id', baseCookieOptions)
  const authSchoolId = useCookie<string | null>('edu_auth_school_id', baseCookieOptions)
  const authSchoolName = useCookie<string | null>('edu_auth_school_name', baseCookieOptions)
  const authRole = useCookie<string | null>('edu_auth_role', baseCookieOptions)
  const authRoles = useCookie<string | null>('edu_auth_roles', baseCookieOptions)
  const authIssuedAt = useCookie<string | null>('edu_auth_issued_at', baseCookieOptions)
  const authExpiresAt = useCookie<string | null>('edu_auth_expires_at', baseCookieOptions)
  const authEmail = useCookie<string | null>('edu_auth_email', baseCookieOptions)
  const authAdminId = useCookie<string | null>('edu_auth_admin_id', baseCookieOptions)
  const authMemberCode = useCookie<string | null>('edu_auth_member_code', baseCookieOptions)
  const authFirstName = useCookie<string | null>('edu_auth_first_name', baseCookieOptions)
  const authLastName = useCookie<string | null>('edu_auth_last_name', baseCookieOptions)
  const authPhone = useCookie<string | null>('edu_auth_phone', baseCookieOptions)

  const roles = computed(() => parseRoles(authRoles.value))

  const profile = computed(() => ({
    memberId: authMemberId.value,
    schoolId: authSchoolId.value,
    schoolName: authSchoolName.value,
    role: authRole.value,
    roles: roles.value,
    issuedAt: authIssuedAt.value,
    expiresAt: authExpiresAt.value,
    email: authEmail.value,
    adminId: authAdminId.value,
    memberCode: authMemberCode.value,
    firstName: authFirstName.value,
    lastName: authLastName.value,
    phone: authPhone.value,
  }))

  const displayName = computed(() => {
    const fullName = [authFirstName.value, authLastName.value].filter(Boolean).join(' ').trim()
    if (fullName) return fullName

    if (authEmail.value) return authEmail.value
    if (authMemberId.value) return `Member ${authMemberId.value.slice(0, 8)}`
    return 'ผู้ใช้งาน'
  })

  const displayRole = computed(() => roleLabel(authRole.value || activeRole.value))

  const schoolDisplay = computed(() => {
    if (authSchoolName.value) return authSchoolName.value
    return 'ยังไม่ระบุโรงเรียน'
  })

  const avatarText = computed(() => {
    const source = displayName.value || authRole.value || 'U'
    return source.charAt(0).toUpperCase()
  })

  function expireAuthCookies() {
    for (const key of authCookieKeys) {
      const cookie = useCookie<string | null>(key, {
        sameSite: 'lax',
        secure: import.meta.env.PROD,
        path: '/',
        maxAge: -1,
      })
      cookie.value = null
    }
  }

  function clearRefreshTimer() {
    if (refreshTimer.value) {
      clearTimeout(refreshTimer.value)
      refreshTimer.value = null
    }
  }

  async function callRefreshEndpoint() {
    const headers = {
      Authorization: `Bearer ${authToken.value}`,
    }

    try {
      return await $fetch<RefreshResponse>(`${config.public.apiBase}/auth/refresh`, {
        method: 'POST',
        headers,
      })
    }
    catch {
      return await $fetch<RefreshResponse>(`${config.public.apiBase}/back-office/auth/refresh`, {
        method: 'POST',
        headers,
      })
    }
  }

  function getRefreshDelayMs(expiresAtRaw: string | null) {
    if (!expiresAtRaw) return null

    const expiresAtMs = Date.parse(expiresAtRaw)
    if (Number.isNaN(expiresAtMs)) return null

    // Token อายุ 10 นาที: รีเฟรชล่วงหน้า 90 วินาที
    const refreshLeadMs = 90 * 1000
    const delay = expiresAtMs - Date.now() - refreshLeadMs
    return Math.max(0, delay)
  }

  async function refreshAccessToken() {
    if (!authToken.value) return false
    if (refreshInFlight.value) return true

    refreshInFlight.value = true
    try {
      const refreshRes = await callRefreshEndpoint()
      authToken.value = refreshRes.data.access_token
      activeRole.value = refreshRes.data.role
      authRole.value = refreshRes.data.role
      authRoles.value = JSON.stringify(refreshRes.data.roles ?? [])
      authExpiresAt.value = refreshRes.data.expires_at

      await fetchMe()
      return true
    }
    catch {
      clearSession()
      return false
    }
    finally {
      refreshInFlight.value = false
    }
  }

  function scheduleAutoRefresh() {
    if (!import.meta.client) return

    clearRefreshTimer()
    if (!authToken.value) return

    const delay = getRefreshDelayMs(authExpiresAt.value)
    if (delay === null) return

    refreshTimer.value = setTimeout(async () => {
      const ok = await refreshAccessToken()
      if (ok) {
        scheduleAutoRefresh()
      }
    }, delay)
  }

  function setupAutoRefresh() {
    if (!import.meta.client) return
    if (autoRefreshStarted.value) return

    autoRefreshStarted.value = true

    watch([authToken, authExpiresAt], () => {
      scheduleAutoRefresh()
    }, { immediate: true })
  }

  function extractMemberCode(row: MemberDirectoryRow | null) {
    if (!row) return null

    return row.admin_code
      || row.staff_code
      || row.teacher_code
      || row.student_code
      || row.parent_code
      || null
  }

  function setMemberProfile(row: MemberDirectoryRow | null) {
    authAdminId.value = row?.id ?? null
    authMemberCode.value = extractMemberCode(row)
    authFirstName.value = row?.first_name ?? null
    authLastName.value = row?.last_name ?? null
    authPhone.value = row?.phone ?? null
  }

  async function fetchProfileByEndpoint(endpoint: string, memberId: string) {
    const headers = {
      Authorization: `Bearer ${authToken.value}`,
    }

    try {
      const res = await $fetch<MemberDirectoryResponse>(`${config.public.apiBase}/back-office/${endpoint}`, {
        headers,
        query: { member_id: memberId },
      })
      return res.data?.[0] ?? null
    }
    catch {
      try {
        const res = await $fetch<MemberDirectoryResponse>(`${config.public.apiBase}/${endpoint}`, {
          headers,
          query: { member_id: memberId },
        })
        return res.data?.[0] ?? null
      }
      catch {
        return null
      }
    }
  }

  async function fetchSchoolProfileById(schoolId: string) {
    if (!authToken.value || !schoolId) return null

    const headers = {
      Authorization: `Bearer ${authToken.value}`,
    }

    try {
      const res = await $fetch<SchoolResponse>(`${config.public.apiBase}/back-office/schools/${schoolId}`, {
        headers,
      })
      authSchoolName.value = res.data?.name ?? null
      return res.data ?? null
    }
    catch {
      try {
        const res = await $fetch<SchoolResponse>(`${config.public.apiBase}/schools/${schoolId}`, {
          headers,
        })
        authSchoolName.value = res.data?.name ?? null
        return res.data ?? null
      }
      catch {
        authSchoolName.value = null
        return null
      }
    }
  }

  function setSession(input: {
    accessToken: string
    activeRole: string
    email?: string
    me: AuthMeData
  }) {
    authToken.value = input.accessToken
    activeRole.value = input.activeRole

    authMemberId.value = input.me.member_id
    authSchoolId.value = input.me.school_id
    authSchoolName.value = null
    authRole.value = input.me.role
    authRoles.value = JSON.stringify(input.me.roles ?? [])
    authIssuedAt.value = input.me.issued_at
    authExpiresAt.value = input.me.expires_at

    if (input.email) {
      authEmail.value = input.email
    }

    scheduleAutoRefresh()
  }

  async function fetchMe() {
    if (!authToken.value) {
      throw new Error('missing-auth-token')
    }

    const res = await $fetch<AuthMeResponse>(`${config.public.apiBase}/auth/me`, {
      headers: {
        Authorization: `Bearer ${authToken.value}`,
      },
    })

    setSession({
      accessToken: authToken.value,
      activeRole: activeRole.value || res.data.role,
      me: res.data,
    })

    await Promise.all([
      fetchMemberProfileByMemberId(res.data.member_id, res.data.role),
      fetchSchoolProfileById(res.data.school_id),
    ])

    return res.data
  }

  async function fetchMemberProfileByMemberId(memberId: string, role?: string | null) {
    if (!authToken.value || !memberId) return null

    const roleKey = (role || authRole.value || activeRole.value || '').toLowerCase()
    const primaryEndpoint = roleEndpointMap[roleKey]

    const endpointQueue = primaryEndpoint
      ? [primaryEndpoint]
      : ['admins', 'staffs', 'teachers', 'students', 'parents']

    for (const endpoint of endpointQueue) {
      const row = await fetchProfileByEndpoint(endpoint, memberId)
      if (row) {
        setMemberProfile(row)
        return row
      }
    }

    setMemberProfile(null)
    return null
  }

  function clearSession() {
    clearRefreshTimer()
    expireAuthCookies()

    authToken.value = null
    activeRole.value = null
    authMemberId.value = null
    authSchoolId.value = null
    authSchoolName.value = null
    authRole.value = null
    authRoles.value = null
    authIssuedAt.value = null
    authExpiresAt.value = null
    authEmail.value = null
    authAdminId.value = null
    authMemberCode.value = null
    authFirstName.value = null
    authLastName.value = null
    authPhone.value = null
  }

  return {
    authToken,
    activeRole,
    profile,
    displayName,
    displayRole,
    schoolDisplay,
    avatarText,
    setSession,
    setMemberProfile,
    fetchMe,
    fetchMemberProfileByMemberId,
    fetchSchoolProfileById,
    refreshAccessToken,
    setupAutoRefresh,
    clearSession,
  }
}
