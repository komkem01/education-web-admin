export interface ClassroomRow {
  id: number
  name: string
  grade: string
  year: string
  teacher: string
  room: string
  studentCount: number
  note: string
}

const initialRows: ClassroomRow[] = [
  { id: 1, name: 'ม.1/1', grade: 'ม.1', year: '2568', teacher: 'ครูสมชาย ใจดี', room: 'อาคาร 1 ห้อง 101', studentCount: 42, note: '' },
  { id: 2, name: 'ม.1/2', grade: 'ม.1', year: '2568', teacher: 'ครูอรทัย สวยงาม', room: 'อาคาร 1 ห้อง 102', studentCount: 40, note: '' },
  { id: 3, name: 'ม.2/1', grade: 'ม.2', year: '2568', teacher: 'ครูประสิทธิ์ มีผล', room: 'อาคาร 2 ห้อง 201', studentCount: 38, note: '' },
  { id: 4, name: 'ม.2/2', grade: 'ม.2', year: '2568', teacher: '', room: 'อาคาร 2 ห้อง 202', studentCount: 35, note: 'ยังไม่มีครูประจำชั้น' },
  { id: 5, name: 'ม.3/1', grade: 'ม.3', year: '2568', teacher: 'ครูวิภา ดีงาม', room: 'อาคาร 2 ห้อง 301', studentCount: 44, note: '' },
  { id: 6, name: 'ม.4/1', grade: 'ม.4', year: '2568', teacher: 'ครูมณี แก้วใส', room: 'อาคาร 3 ห้อง 401', studentCount: 36, note: '' },
  { id: 7, name: 'ม.5/1', grade: 'ม.5', year: '2568', teacher: 'ครูสันติ รักดี', room: 'อาคาร 3 ห้อง 501', studentCount: 33, note: '' },
  { id: 8, name: 'ม.6/1', grade: 'ม.6', year: '2568', teacher: 'ครูจันทร์ นภา', room: 'อาคาร 3 ห้อง 601', studentCount: 31, note: '' },
]

export const useClassroomsData = () => {
  const rows = useState<ClassroomRow[]>('classrooms', () => initialRows.map(r => ({ ...r })))
  return { rows }
}
