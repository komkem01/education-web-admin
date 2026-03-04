export interface EducationRecord {
  degree: string
  major: string
  institution: string
  year: string
  gpa: string
}

export interface WorkRecord {
  position: string
  organization: string
  startYear: string
  endYear: string
  note: string
}

export interface TeacherRow {
  id: string
  name: string
  subject: string
  class: string
  courses: number
  status: string
  idCard: string
  birthdate: string
  phone: string
  email: string
  address: string
  education: EducationRecord[]
  workHistory: WorkRecord[]
}

const initialRows: TeacherRow[] = [
  {
    id: 'T001', name: 'นายสมชาย ใจดี', subject: 'ภาษาไทย', class: 'ม.1/1', courses: 3, status: 'อนุมัติแล้ว',
    idCard: '1-1001-00001-00-1', birthdate: '1985-03-15', phone: '081-234-5678', email: 'somchai@school.ac.th',
    address: '123 ถนนพหลโยธิน แขวงจตุจักร เขตจตุจักร กรุงเทพฯ 10900',
    education: [
      { degree: 'ปริญญาตรี', major: 'การสอนภาษาไทย', institution: 'มหาวิทยาลัยศรีนครินทรวิโรฒ', year: '2550', gpa: '3.45' },
      { degree: 'ปริญญาโท', major: 'หลักสูตรและการสอน', institution: 'จุฬาลงกรณ์มหาวิทยาลัย', year: '2554', gpa: '3.72' },
    ],
    workHistory: [
      { position: 'ครูผู้สอน', organization: 'โรงเรียนสาธิต มศว', startYear: '2551', endYear: '2555', note: '' },
      { position: 'ครูผู้สอน', organization: 'โรงเรียนปัจจุบัน', startYear: '2555', endYear: 'ปัจจุบัน', note: '' },
    ],
  },
  {
    id: 'T002', name: 'นางอรทัย สวยงาม', subject: 'คณิตศาสตร์', class: 'ม.2/2', courses: 4, status: 'อนุมัติแล้ว',
    idCard: '1-1002-00002-00-2', birthdate: '1988-07-22', phone: '089-876-5432', email: 'orathai@school.ac.th',
    address: '456 ถนนลาดพร้าว แขวงลาดพร้าว เขตลาดพร้าว กรุงเทพฯ 10230',
    education: [
      { degree: 'ปริญญาตรี', major: 'คณิตศาสตร์ศึกษา', institution: 'มหาวิทยาลัยเกษตรศาสตร์', year: '2553', gpa: '3.60' },
    ],
    workHistory: [
      { position: 'ครูผู้สอน', organization: 'โรงเรียนปัจจุบัน', startYear: '2553', endYear: 'ปัจจุบัน', note: '' },
    ],
  },
  {
    id: 'T003', name: 'นายวิชัย มานะ', subject: 'วิทยาศาสตร์', class: 'ม.3/1', courses: 2, status: 'อนุมัติแล้ว',
    idCard: '', birthdate: '1990-11-05', phone: '083-111-2222', email: '',
    address: '',
    education: [
      { degree: 'ปริญญาตรี', major: 'ฟิสิกส์', institution: 'มหาวิทยาลัยมหิดล', year: '2555', gpa: '3.20' },
    ],
    workHistory: [
      { position: 'ครูผู้สอน', organization: 'โรงเรียนปัจจุบัน', startYear: '2556', endYear: 'ปัจจุบัน', note: '' },
    ],
  },
  {
    id: 'T004', name: 'นางสาวมาลี รักเรียน', subject: 'ภาษาต่างประเทศ', class: '—', courses: 5, status: 'รออนุมัติ',
    idCard: '', birthdate: '', phone: '087-333-4444', email: 'malee@school.ac.th',
    address: '', education: [], workHistory: [],
  },
  {
    id: 'T005', name: 'นายสุรชัย ตั้งใจ', subject: 'สังคมศึกษา', class: 'ม.4/3', courses: 3, status: 'อนุมัติแล้ว',
    idCard: '1-1005-00005-00-5', birthdate: '1982-01-30', phone: '086-555-6666', email: 'surachai@school.ac.th',
    address: '789 ถนนสุขุมวิท กรุงเทพฯ',
    education: [
      { degree: 'ปริญญาตรี', major: 'สังคมศึกษา', institution: 'มหาวิทยาลัยธรรมศาสตร์', year: '2548', gpa: '3.30' },
      { degree: 'ปริญญาโท', major: 'รัฐศาสตร์', institution: 'มหาวิทยาลัยธรรมศาสตร์', year: '2552', gpa: '3.50' },
    ],
    workHistory: [
      { position: 'เจ้าหน้าที่วิเคราะห์', organization: 'สำนักงานเขตพื้นที่การศึกษา', startYear: '2549', endYear: '2553', note: '' },
      { position: 'ครูผู้สอน', organization: 'โรงเรียนปัจจุบัน', startYear: '2553', endYear: 'ปัจจุบัน', note: '' },
    ],
  },
]

export const useTeachersData = () => {
  const rows = useState<TeacherRow[]>('teachers', () =>
    initialRows.map(r => ({
      ...r,
      education: r.education.map(e => ({ ...e })),
      workHistory: r.workHistory.map(w => ({ ...w })),
    }))
  )
  return { rows }
}
