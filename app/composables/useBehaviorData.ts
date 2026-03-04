export type BehaviorType = 'ดี' | 'ไม่ดี'

export interface BehaviorRow {
  id: number
  studentId: string
  studentName: string
  classroom: string
  type: BehaviorType
  category: string
  description: string
  points: number
  date: string
  recordedBy: string
}

export const GOOD_CATEGORIES = ['ช่วยเหลือผู้อื่น', 'มีจิตอาสา', 'เรียนดีเด่น', 'กีฬาเด่น', 'รักษาความสะอาด', 'ประพฤติดีเด่น']
export const BAD_CATEGORIES = ['ทะเลาะวิวาท', 'แต่งกายผิดระเบียบ', 'หนีเรียน', 'ใช้โทรศัพท์ในห้องเรียน', 'ทำลายทรัพย์สิน', 'มาสาย']

const initialRows: BehaviorRow[] = [
  { id: 1, studentId: '66100001', studentName: 'เด็กชายกิตติ วงษ์ใหญ่', classroom: 'ม.1/1', type: 'ดี', category: 'ช่วยเหลือผู้อื่น', description: 'ช่วยเหลือเพื่อนนักเรียนที่บาดเจ็บ', points: 5, date: '2026-03-01', recordedBy: 'ครูสมชาย ใจดี' },
  { id: 2, studentId: '66100002', studentName: 'เด็กหญิงนภา รักษ์สกุล', classroom: 'ม.1/1', type: 'ดี', category: 'เรียนดีเด่น', description: 'ได้คะแนนสูงสุดในชั้นเรียนวิชาคณิตศาสตร์', points: 10, date: '2026-03-02', recordedBy: 'ครูอรทัย สวยงาม' },
  { id: 3, studentId: '65200045', studentName: 'นายพงษ์ศักดิ์ ดีมาก', classroom: 'ม.2/3', type: 'ไม่ดี', category: 'แต่งกายผิดระเบียบ', description: 'ไม่สวมเนคไทและรองเท้าไม่ถูกระเบียบ', points: -3, date: '2026-03-02', recordedBy: 'ครูวิภา ดีงาม' },
  { id: 4, studentId: '65200046', studentName: 'นางสาวสุภา เรียนดี', classroom: 'ม.2/3', type: 'ดี', category: 'มีจิตอาสา', description: 'เข้าร่วมกิจกรรมบำเพ็ญประโยชน์ของโรงเรียน', points: 8, date: '2026-03-03', recordedBy: 'ครูมณี แก้วใส' },
  { id: 5, studentId: '64300012', studentName: 'นายวุฒิ กล้าหาญ', classroom: 'ม.3/2', type: 'ไม่ดี', category: 'ใช้โทรศัพท์ในห้องเรียน', description: 'ใช้โทรศัพท์ระหว่างชั่วโมงเรียนวิชาสังคม', points: -5, date: '2026-03-03', recordedBy: 'ครูสุรชัย ตั้งใจ' },
  { id: 6, studentId: '66100001', studentName: 'เด็กชายกิตติ วงษ์ใหญ่', classroom: 'ม.1/1', type: 'ดี', category: 'กีฬาเด่น', description: 'ได้รับรางวัลรองชนะเลิศการแข่งขันฟุตบอลระหว่างโรงเรียน', points: 15, date: '2026-03-04', recordedBy: 'ครูสมชาย ใจดี' },
  { id: 7, studentId: '65200045', studentName: 'นายพงษ์ศักดิ์ ดีมาก', classroom: 'ม.2/3', type: 'ไม่ดี', category: 'มาสาย', description: 'มาโรงเรียนสายเกิน 15 นาที โดยไม่มีใบรับรอง', points: -2, date: '2026-03-04', recordedBy: 'ครูวิภา ดีงาม' },
]

export const useBehaviorData = () => {
  const rows = useState<BehaviorRow[]>('behavior', () => initialRows.map(r => ({ ...r })))
  return { rows }
}
