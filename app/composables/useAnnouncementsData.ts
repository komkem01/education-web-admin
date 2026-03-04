export type AnnouncementCategory = 'ทั่วไป' | 'วิชาการ' | 'กิจกรรม' | 'งานบุคคล' | 'ฉุกเฉิน'
export type AnnouncementTarget = 'ทุกคน' | 'ครู' | 'นักเรียน' | 'ผู้ปกครอง'
export type AnnouncementStatus = 'เผยแพร่' | 'ฉบับร่าง' | 'หมดอายุ'

export interface AnnouncementRow {
  id: number
  title: string
  content: string
  category: AnnouncementCategory
  target: AnnouncementTarget
  publishedAt: string
  expiresAt: string
  isPinned: boolean
  status: AnnouncementStatus
  createdBy: string
}

const initialRows: AnnouncementRow[] = [
  {
    id: 1, title: 'กำหนดการสอบกลางภาค ภาคเรียนที่ 1/2568',
    content: 'แจ้งนักเรียนทราบว่าการสอบกลางภาคจะจัดขึ้นระหว่างวันที่ 10–14 มีนาคม 2568 ขอให้นักเรียนเตรียมตัวให้พร้อม',
    category: 'วิชาการ', target: 'นักเรียน', publishedAt: '2026-03-01', expiresAt: '2026-03-15',
    isPinned: true, status: 'เผยแพร่', createdBy: 'ฝ่ายวิชาการ',
  },
  {
    id: 2, title: 'ประชุมผู้ปกครองนักเรียน ม.1–3',
    content: 'ขอเชิญผู้ปกครองนักเรียนชั้น ม.1–3 เข้าร่วมประชุมประจำปีการศึกษา 2568 ในวันเสาร์ที่ 8 มีนาคม 2569 เวลา 09:00–12:00 น. ณ หอประชุมโรงเรียน',
    category: 'กิจกรรม', target: 'ผู้ปกครอง', publishedAt: '2026-02-25', expiresAt: '2026-03-08',
    isPinned: true, status: 'เผยแพร่', createdBy: 'ฝ่ายกิจการนักเรียน',
  },
  {
    id: 3, title: 'แจ้งหยุดวันจักรี 6 เมษายน 2568',
    content: 'โรงเรียนหยุดทำการเรียนการสอนในวันจักรี วันจันทร์ที่ 6 เมษายน 2568',
    category: 'ทั่วไป', target: 'ทุกคน', publishedAt: '2026-03-03', expiresAt: '2026-04-07',
    isPinned: false, status: 'เผยแพร่', createdBy: 'ฝ่ายบริหารทั่วไป',
  },
  {
    id: 4, title: 'อบรมครูเรื่องการใช้เทคโนโลยีในห้องเรียน',
    content: 'ขอเชิญครูทุกท่านเข้าร่วมอบรมเชิงปฏิบัติการ หัวข้อ "การใช้ AI เพื่อการเรียนรู้" วันเสาร์ที่ 15 มีนาคม 2568',
    category: 'งานบุคคล', target: 'ครู', publishedAt: '2026-03-04', expiresAt: '2026-03-15',
    isPinned: false, status: 'เผยแพร่', createdBy: 'ฝ่ายบุคคล',
  },
  {
    id: 5, title: 'ร่าง: แนวปฏิบัติการแต่งกายนักเรียน ปี 2568',
    content: 'อยู่ระหว่างการพิจารณาปรับปรุงระเบียบการแต่งกายนักเรียน จะมีการประกาศอีกครั้ง',
    category: 'ทั่วไป', target: 'ทุกคน', publishedAt: '', expiresAt: '',
    isPinned: false, status: 'ฉบับร่าง', createdBy: 'ฝ่ายกิจการนักเรียน',
  },
  {
    id: 6, title: 'แจ้งปิดภาคเรียนที่ 1/2567',
    content: 'โรงเรียนปิดภาคเรียนที่ 1/2567 ตั้งแต่วันที่ 10 ตุลาคม 2567',
    category: 'ทั่วไป', target: 'ทุกคน', publishedAt: '2024-10-01', expiresAt: '2024-10-15',
    isPinned: false, status: 'หมดอายุ', createdBy: 'ฝ่ายบริหารทั่วไป',
  },
]

export const useAnnouncementsData = () => {
  const rows = useState<AnnouncementRow[]>('announcements', () => initialRows.map(r => ({ ...r })))
  return { rows }
}
