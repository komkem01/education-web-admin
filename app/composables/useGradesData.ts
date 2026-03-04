export interface GradeRow {
  id: number
  studentId: string
  studentName: string
  classroom: string
  courseCode: string
  courseName: string
  semester: string
  year: string
  midScore: number | null
  finalScore: number | null
  activityScore: number | null
}

function computeTotal(r: GradeRow): number | null {
  if (r.midScore === null && r.finalScore === null && r.activityScore === null) return null
  return (r.midScore ?? 0) + (r.finalScore ?? 0) + (r.activityScore ?? 0)
}

function computeGrade(total: number | null): string {
  if (total === null) return 'รอผล'
  if (total >= 80) return '4'
  if (total >= 75) return '3.5'
  if (total >= 70) return '3'
  if (total >= 65) return '2.5'
  if (total >= 60) return '2'
  if (total >= 55) return '1.5'
  if (total >= 50) return '1'
  return '0'
}

const raw: Omit<GradeRow, 'id'>[] = [
  { studentId: 'S001', studentName: 'เด็กชายสมศักดิ์ ใจดี',   classroom: 'ม.1/1', courseCode: 'M101', courseName: 'คณิตศาสตร์พื้นฐาน 1', semester: '1', year: '2568', midScore: 28, finalScore: 38, activityScore: 18 },
  { studentId: 'S002', studentName: 'เด็กหญิงมาลี สวยงาม',    classroom: 'ม.1/1', courseCode: 'M101', courseName: 'คณิตศาสตร์พื้นฐาน 1', semester: '1', year: '2568', midScore: 35, finalScore: 40, activityScore: 20 },
  { studentId: 'S003', studentName: 'เด็กชายวีระ มานะ',        classroom: 'ม.1/1', courseCode: 'M101', courseName: 'คณิตศาสตร์พื้นฐาน 1', semester: '1', year: '2568', midScore: 20, finalScore: 28, activityScore: 15 },
  { studentId: 'S004', studentName: 'เด็กหญิงนุช จริงใจ',     classroom: 'ม.1/1', courseCode: 'M101', courseName: 'คณิตศาสตร์พื้นฐาน 1', semester: '1', year: '2568', midScore: 22, finalScore: 30, activityScore: 16 },
  { studentId: 'S005', studentName: 'เด็กชายธนา รักดี',        classroom: 'ม.1/1', courseCode: 'M101', courseName: 'คณิตศาสตร์พื้นฐาน 1', semester: '1', year: '2568', midScore: null, finalScore: null, activityScore: null },
  { studentId: 'S001', studentName: 'เด็กชายสมศักดิ์ ใจดี',   classroom: 'ม.1/1', courseCode: 'T101', courseName: 'ภาษาไทยพื้นฐาน 1',   semester: '1', year: '2568', midScore: 30, finalScore: 36, activityScore: 19 },
  { studentId: 'S002', studentName: 'เด็กหญิงมาลี สวยงาม',    classroom: 'ม.1/1', courseCode: 'T101', courseName: 'ภาษาไทยพื้นฐาน 1',   semester: '1', year: '2568', midScore: 32, finalScore: 38, activityScore: 20 },
  { studentId: 'S003', studentName: 'เด็กชายวีระ มานะ',        classroom: 'ม.1/1', courseCode: 'T101', courseName: 'ภาษาไทยพื้นฐาน 1',   semester: '1', year: '2568', midScore: 18, finalScore: 24, activityScore: 14 },
  { studentId: 'S004', studentName: 'เด็กหญิงนุช จริงใจ',     classroom: 'ม.1/1', courseCode: 'T101', courseName: 'ภาษาไทยพื้นฐาน 1',   semester: '1', year: '2568', midScore: 26, finalScore: 33, activityScore: 17 },
  { studentId: 'S005', studentName: 'เด็กชายธนา รักดี',        classroom: 'ม.1/1', courseCode: 'T101', courseName: 'ภาษาไทยพื้นฐาน 1',   semester: '1', year: '2568', midScore: 14, finalScore: 18, activityScore: 12 },
  { studentId: 'S001', studentName: 'เด็กชายสมศักดิ์ ใจดี',   classroom: 'ม.1/1', courseCode: 'S101', courseName: 'วิทยาศาสตร์พื้นฐาน 1', semester: '1', year: '2568', midScore: 27, finalScore: 35, activityScore: 18 },
  { studentId: 'S002', studentName: 'เด็กหญิงมาลี สวยงาม',    classroom: 'ม.1/1', courseCode: 'S101', courseName: 'วิทยาศาสตร์พื้นฐาน 1', semester: '1', year: '2568', midScore: 33, finalScore: 39, activityScore: 20 },
  { studentId: 'S003', studentName: 'เด็กชายวีระ มานะ',        classroom: 'ม.1/1', courseCode: 'S101', courseName: 'วิทยาศาสตร์พื้นฐาน 1', semester: '1', year: '2568', midScore: null, finalScore: null, activityScore: null },
]

export const initialRows: GradeRow[] = raw.map((r, i) => ({ id: i + 1, ...r }))

export function getTotal(r: GradeRow) { return computeTotal(r) }
export function getGrade(r: GradeRow) { return computeGrade(computeTotal(r)) }
export function getStatus(r: GradeRow): 'ผ่าน' | 'ไม่ผ่าน' | 'รอผล' {
  const t = computeTotal(r)
  if (t === null) return 'รอผล'
  return t >= 50 ? 'ผ่าน' : 'ไม่ผ่าน'
}

export const useGradesData = () => {
  const rows = useState<GradeRow[]>('grades', () => initialRows.map(r => ({ ...r })))
  return { rows }
}
