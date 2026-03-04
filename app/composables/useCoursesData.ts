export interface CourseRow {
  id: number
  code: string
  name: string
  subjectGroup: string
  level: string
  credits: number
  hoursPerWeek: number
  semester: string
  year: string
  teacherName: string
  description: string
}

const initialRows: CourseRow[] = [
  { id: 1, code: 'T101', name: 'ภาษาไทยพื้นฐาน 1', subjectGroup: 'กลุ่มสาระภาษาไทย', level: 'ม.1', credits: 1.5, hoursPerWeek: 3, semester: '1', year: '2568', teacherName: 'ครูสมหญิง ภาษาดี', description: 'ฝึกทักษะการฟัง พูด อ่าน เขียนภาษาไทย' },
  { id: 2, code: 'T201', name: 'ภาษาไทยพื้นฐาน 3', subjectGroup: 'กลุ่มสาระภาษาไทย', level: 'ม.2', credits: 1.5, hoursPerWeek: 3, semester: '1', year: '2568', teacherName: 'ครูสมหญิง ภาษาดี', description: 'ภาษาไทยระดับมัธยมศึกษาปีที่ 2' },
  { id: 3, code: 'M101', name: 'คณิตศาสตร์พื้นฐาน 1', subjectGroup: 'กลุ่มสาระคณิตศาสตร์', level: 'ม.1', credits: 3, hoursPerWeek: 5, semester: '1', year: '2568', teacherName: 'ครูวิชัย เลขเก่ง', description: 'จำนวนเต็ม เศษส่วน ทศนิยม' },
  { id: 4, code: 'M401', name: 'คณิตศาสตร์เพิ่มเติม 1', subjectGroup: 'กลุ่มสาระคณิตศาสตร์', level: 'ม.4', credits: 1.5, hoursPerWeek: 3, semester: '1', year: '2568', teacherName: 'ครูวิชัย เลขเก่ง', description: 'เซต ตรรกศาสตร์ จำนวนจริง' },
  { id: 5, code: 'S101', name: 'วิทยาศาสตร์พื้นฐาน 1', subjectGroup: 'กลุ่มสาระวิทยาศาสตร์และเทคโนโลยี', level: 'ม.1', credits: 1.5, hoursPerWeek: 3, semester: '1', year: '2568', teacherName: 'ครูณัฐพล วิทยาไกล', description: 'สิ่งมีชีวิต เซลล์ พันธุกรรม' },
  { id: 6, code: 'S401', name: 'ฟิสิกส์พื้นฐาน', subjectGroup: 'กลุ่มสาระวิทยาศาสตร์และเทคโนโลยี', level: 'ม.4', credits: 1.5, hoursPerWeek: 3, semester: '1', year: '2568', teacherName: 'ครูณัฐพล วิทยาไกล', description: 'แรงและการเคลื่อนที่' },
  { id: 7, code: 'S402', name: 'เคมีพื้นฐาน', subjectGroup: 'กลุ่มสาระวิทยาศาสตร์และเทคโนโลยี', level: 'ม.4', credits: 1.5, hoursPerWeek: 3, semester: '1', year: '2568', teacherName: 'ครูณัฐพล วิทยาไกล', description: 'อะตอมและตารางธาตุ' },
  { id: 8, code: 'L101', name: 'ภาษาอังกฤษพื้นฐาน 1', subjectGroup: 'กลุ่มสาระภาษาต่างประเทศ', level: 'ม.1', credits: 1.5, hoursPerWeek: 3, semester: '1', year: '2568', teacherName: 'ครูสุดาพร อังกฤษดี', description: 'ทักษะภาษาอังกฤษระดับพื้นฐาน' },
  { id: 9, code: 'P101', name: 'พลศึกษา 1', subjectGroup: 'กลุ่มสาระสุขศึกษาและพลศึกษา', level: 'ม.1', credits: 0.5, hoursPerWeek: 1, semester: '1', year: '2568', teacherName: 'ครูกิตติ พละกำลัง', description: 'กีฬาและการออกกำลังกาย' },
  { id: 10, code: 'SO101', name: 'สังคมศึกษา 1', subjectGroup: 'กลุ่มสาระสังคมศึกษาฯ', level: 'ม.1', credits: 1.5, hoursPerWeek: 3, semester: '1', year: '2568', teacherName: 'ครูชนิดา สังคมดี', description: 'ภูมิศาสตร์ ประวัติศาสตร์ หน้าที่พลเมือง' },
  { id: 11, code: 'T102', name: 'ภาษาไทยพื้นฐาน 2', subjectGroup: 'กลุ่มสาระภาษาไทย', level: 'ม.1', credits: 1.5, hoursPerWeek: 3, semester: '2', year: '2568', teacherName: 'ครูสมหญิง ภาษาดี', description: 'ต่อเนื่องจากภาษาไทยพื้นฐาน 1' },
  { id: 12, code: 'M102', name: 'คณิตศาสตร์พื้นฐาน 2', subjectGroup: 'กลุ่มสาระคณิตศาสตร์', level: 'ม.1', credits: 3, hoursPerWeek: 5, semester: '2', year: '2568', teacherName: 'ครูวิชัย เลขเก่ง', description: 'สมการ อสมการ กราฟ' },
]

export const useCoursesData = () => {
  const rows = useState<CourseRow[]>('courses', () => initialRows.map(r => ({ ...r })))
  return { rows }
}
