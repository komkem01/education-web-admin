export type DayName = 'จันทร์' | 'อังคาร' | 'พุธ' | 'พฤหัสบดี' | 'ศุกร์' | 'เสาร์' | 'อาทิตย์'

export interface TimetableSlot {
  id: number
  classroom: string
  day: DayName
  period: number
  courseCode: string
  courseName: string
  teacherName: string
  room: string
}

export const DAYS: DayName[] = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์']

export const PERIODS = [
  { num: 1, start: '08:00', end: '08:50' },
  { num: 2, start: '08:50', end: '09:40' },
  { num: 3, start: '09:40', end: '10:30' },
  { num: 4, start: '10:30', end: '11:20' },
  { num: 5, start: '12:00', end: '12:50' },
  { num: 6, start: '12:50', end: '13:40' },
  { num: 7, start: '13:40', end: '14:30' },
  { num: 8, start: '14:30', end: '15:20' },
]

const initialSlots: TimetableSlot[] = [
  // ม.1/1
  { id: 1,  classroom: 'ม.1/1', day: 'จันทร์',       period: 1, courseCode: 'M101', courseName: 'คณิตศาสตร์พื้นฐาน 1',  teacherName: 'ครูวิชัย เลขเก่ง',      room: '101' },
  { id: 2,  classroom: 'ม.1/1', day: 'จันทร์',       period: 2, courseCode: 'M101', courseName: 'คณิตศาสตร์พื้นฐาน 1',  teacherName: 'ครูวิชัย เลขเก่ง',      room: '101' },
  { id: 3,  classroom: 'ม.1/1', day: 'จันทร์',       period: 3, courseCode: 'T101', courseName: 'ภาษาไทยพื้นฐาน 1',      teacherName: 'ครูสมหญิง ภาษาดี',      room: '101' },
  { id: 4,  classroom: 'ม.1/1', day: 'จันทร์',       period: 5, courseCode: 'L101', courseName: 'ภาษาอังกฤษพื้นฐาน 1',   teacherName: 'ครูสุดาพร อังกฤษดี',    room: '101' },
  { id: 5,  classroom: 'ม.1/1', day: 'จันทร์',       period: 6, courseCode: 'L101', courseName: 'ภาษาอังกฤษพื้นฐาน 1',   teacherName: 'ครูสุดาพร อังกฤษดี',    room: '101' },
  { id: 6,  classroom: 'ม.1/1', day: 'อังคาร',       period: 1, courseCode: 'S101', courseName: 'วิทยาศาสตร์พื้นฐาน 1',  teacherName: 'ครูณัฐพล วิทยาไกล',     room: 'วิทย์ 1' },
  { id: 7,  classroom: 'ม.1/1', day: 'อังคาร',       period: 2, courseCode: 'S101', courseName: 'วิทยาศาสตร์พื้นฐาน 1',  teacherName: 'ครูณัฐพล วิทยาไกล',     room: 'วิทย์ 1' },
  { id: 8,  classroom: 'ม.1/1', day: 'อังคาร',       period: 3, courseCode: 'SO101', courseName: 'สังคมศึกษา 1',          teacherName: 'ครูชนิดา สังคมดี',      room: '101' },
  { id: 9,  classroom: 'ม.1/1', day: 'อังคาร',       period: 5, courseCode: 'T101', courseName: 'ภาษาไทยพื้นฐาน 1',      teacherName: 'ครูสมหญิง ภาษาดี',      room: '101' },
  { id: 10, classroom: 'ม.1/1', day: 'อังคาร',       period: 7, courseCode: 'P101', courseName: 'พลศึกษา 1',              teacherName: 'ครูกิตติ พละกำลัง',     room: 'สนาม' },
  { id: 11, classroom: 'ม.1/1', day: 'พุธ',          period: 1, courseCode: 'T101', courseName: 'ภาษาไทยพื้นฐาน 1',      teacherName: 'ครูสมหญิง ภาษาดี',      room: '101' },
  { id: 12, classroom: 'ม.1/1', day: 'พุธ',          period: 2, courseCode: 'M101', courseName: 'คณิตศาสตร์พื้นฐาน 1',   teacherName: 'ครูวิชัย เลขเก่ง',      room: '101' },
  { id: 13, classroom: 'ม.1/1', day: 'พุธ',          period: 3, courseCode: 'M101', courseName: 'คณิตศาสตร์พื้นฐาน 1',   teacherName: 'ครูวิชัย เลขเก่ง',      room: '101' },
  { id: 14, classroom: 'ม.1/1', day: 'พฤหัสบดี',     period: 1, courseCode: 'L101', courseName: 'ภาษาอังกฤษพื้นฐาน 1',   teacherName: 'ครูสุดาพร อังกฤษดี',    room: '101' },
  { id: 15, classroom: 'ม.1/1', day: 'พฤหัสบดี',     period: 2, courseCode: 'SO101', courseName: 'สังคมศึกษา 1',          teacherName: 'ครูชนิดา สังคมดี',      room: '101' },
  { id: 16, classroom: 'ม.1/1', day: 'พฤหัสบดี',     period: 3, courseCode: 'SO101', courseName: 'สังคมศึกษา 1',          teacherName: 'ครูชนิดา สังคมดี',      room: '101' },
  { id: 17, classroom: 'ม.1/1', day: 'ศุกร์',        period: 1, courseCode: 'S101', courseName: 'วิทยาศาสตร์พื้นฐาน 1',  teacherName: 'ครูณัฐพล วิทยาไกล',     room: 'วิทย์ 1' },
  { id: 18, classroom: 'ม.1/1', day: 'ศุกร์',        period: 5, courseCode: 'M101', courseName: 'คณิตศาสตร์พื้นฐาน 1',   teacherName: 'ครูวิชัย เลขเก่ง',      room: '101' },
  // ม.2/1
  { id: 19, classroom: 'ม.2/1', day: 'จันทร์',       period: 1, courseCode: 'T201', courseName: 'ภาษาไทยพื้นฐาน 3',      teacherName: 'ครูสมหญิง ภาษาดี',      room: '201' },
  { id: 20, classroom: 'ม.2/1', day: 'จันทร์',       period: 2, courseCode: 'T201', courseName: 'ภาษาไทยพื้นฐาน 3',      teacherName: 'ครูสมหญิง ภาษาดี',      room: '201' },
  { id: 21, classroom: 'ม.2/1', day: 'อังคาร',       period: 1, courseCode: 'L101', courseName: 'ภาษาอังกฤษพื้นฐาน 1',   teacherName: 'ครูสุดาพร อังกฤษดี',    room: '201' },
  { id: 22, classroom: 'ม.2/1', day: 'พุธ',          period: 1, courseCode: 'M201', courseName: 'คณิตศาสตร์พื้นฐาน 3',   teacherName: 'ครูวิชัย เลขเก่ง',      room: '201' },
]

export const useTimetableData = () => {
  const slots = useState<TimetableSlot[]>('timetable', () => initialSlots.map(s => ({ ...s })))
  return { slots }
}
