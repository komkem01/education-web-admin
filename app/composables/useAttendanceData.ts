export type AttendanceStatus = 'มาเรียน' | 'ขาด' | 'ลา' | 'สาย'

export interface AttendanceRow {
  id: number
  studentId: string
  studentName: string
  classroom: string
  date: string   // YYYY-MM-DD
  period: number
  courseName: string
  status: AttendanceStatus
  note: string
}

const initialRows: AttendanceRow[] = [
  // 2026-03-02 ม.1/1 คาบ 1 คณิตศาสตร์
  { id: 1,  studentId: 'S001', studentName: 'เด็กชายสมศักดิ์ ใจดี',  classroom: 'ม.1/1', date: '2026-03-02', period: 1, courseName: 'คณิตศาสตร์พื้นฐาน 1', status: 'มาเรียน', note: '' },
  { id: 2,  studentId: 'S002', studentName: 'เด็กหญิงมาลี สวยงาม',   classroom: 'ม.1/1', date: '2026-03-02', period: 1, courseName: 'คณิตศาสตร์พื้นฐาน 1', status: 'มาเรียน', note: '' },
  { id: 3,  studentId: 'S003', studentName: 'เด็กชายวีระ มานะ',       classroom: 'ม.1/1', date: '2026-03-02', period: 1, courseName: 'คณิตศาสตร์พื้นฐาน 1', status: 'ขาด',     note: '' },
  { id: 4,  studentId: 'S004', studentName: 'เด็กหญิงนุช จริงใจ',    classroom: 'ม.1/1', date: '2026-03-02', period: 1, courseName: 'คณิตศาสตร์พื้นฐาน 1', status: 'ลา',      note: 'ลาป่วย' },
  { id: 5,  studentId: 'S005', studentName: 'เด็กชายธนา รักดี',       classroom: 'ม.1/1', date: '2026-03-02', period: 1, courseName: 'คณิตศาสตร์พื้นฐาน 1', status: 'สาย',     note: 'รถติด 10 นาที' },
  // 2026-03-02 ม.1/1 คาบ 3 ภาษาไทย
  { id: 6,  studentId: 'S001', studentName: 'เด็กชายสมศักดิ์ ใจดี',  classroom: 'ม.1/1', date: '2026-03-02', period: 3, courseName: 'ภาษาไทยพื้นฐาน 1', status: 'มาเรียน', note: '' },
  { id: 7,  studentId: 'S002', studentName: 'เด็กหญิงมาลี สวยงาม',   classroom: 'ม.1/1', date: '2026-03-02', period: 3, courseName: 'ภาษาไทยพื้นฐาน 1', status: 'มาเรียน', note: '' },
  { id: 8,  studentId: 'S003', studentName: 'เด็กชายวีระ มานะ',       classroom: 'ม.1/1', date: '2026-03-02', period: 3, courseName: 'ภาษาไทยพื้นฐาน 1', status: 'ขาด',     note: '' },
  { id: 9,  studentId: 'S004', studentName: 'เด็กหญิงนุช จริงใจ',    classroom: 'ม.1/1', date: '2026-03-02', period: 3, courseName: 'ภาษาไทยพื้นฐาน 1', status: 'ลา',      note: 'ลาป่วย' },
  { id: 10, studentId: 'S005', studentName: 'เด็กชายธนา รักดี',       classroom: 'ม.1/1', date: '2026-03-02', period: 3, courseName: 'ภาษาไทยพื้นฐาน 1', status: 'มาเรียน', note: '' },
  // 2026-03-03 ม.1/1 คาบ 1 วิทยาศาสตร์
  { id: 11, studentId: 'S001', studentName: 'เด็กชายสมศักดิ์ ใจดี',  classroom: 'ม.1/1', date: '2026-03-03', period: 1, courseName: 'วิทยาศาสตร์พื้นฐาน 1', status: 'มาเรียน', note: '' },
  { id: 12, studentId: 'S002', studentName: 'เด็กหญิงมาลี สวยงาม',   classroom: 'ม.1/1', date: '2026-03-03', period: 1, courseName: 'วิทยาศาสตร์พื้นฐาน 1', status: 'มาเรียน', note: '' },
  { id: 13, studentId: 'S003', studentName: 'เด็กชายวีระ มานะ',       classroom: 'ม.1/1', date: '2026-03-03', period: 1, courseName: 'วิทยาศาสตร์พื้นฐาน 1', status: 'มาเรียน', note: '' },
  { id: 14, studentId: 'S004', studentName: 'เด็กหญิงนุช จริงใจ',    classroom: 'ม.1/1', date: '2026-03-03', period: 1, courseName: 'วิทยาศาสตร์พื้นฐาน 1', status: 'ขาด',     note: '' },
  { id: 15, studentId: 'S005', studentName: 'เด็กชายธนา รักดี',       classroom: 'ม.1/1', date: '2026-03-03', period: 1, courseName: 'วิทยาศาสตร์พื้นฐาน 1', status: 'มาเรียน', note: '' },
]

export const useAttendanceData = () => {
  const rows = useState<AttendanceRow[]>('attendance', () => initialRows.map(r => ({ ...r })))
  return { rows }
}
