export type EventType = 'holiday' | 'exam' | 'activity' | 'meeting' | 'other'

export interface CalendarEvent {
  id: number
  title: string
  date: string
  endDate?: string
  type: EventType
  description?: string
}

const initialEvents: CalendarEvent[] = [
  { id: 1, title: 'วันมาฆบูชา', date: '2026-03-04', type: 'holiday', description: 'วันหยุดราชการ' },
  { id: 2, title: 'สอบกลางภาค ม.1–3', date: '2026-03-10', endDate: '2026-03-14', type: 'exam', description: 'สอบกลางภาคเรียนที่ 1/2568' },
  { id: 3, title: 'ประชุมผู้ปกครอง ม.1–3', date: '2026-03-08', type: 'meeting', description: 'ประชุมประจำภาคเรียน ณ หอประชุม เวลา 09:00 น.' },
  { id: 4, title: 'กิจกรรมวันเด็กแห่งชาติ', date: '2026-03-15', type: 'activity', description: 'กิจกรรมวันเด็กประจำปี 2568' },
  { id: 5, title: 'ปิดภาคเรียนที่ 1/2568', date: '2026-03-31', type: 'holiday', description: 'หยุดปิดภาคเรียน' },
  { id: 6, title: 'วันจักรี', date: '2026-04-06', type: 'holiday', description: 'วันหยุดราชการ' },
  { id: 7, title: 'วันสงกรานต์', date: '2026-04-13', endDate: '2026-04-15', type: 'holiday', description: 'วันหยุดสงกรานต์ 13–15 เมษายน' },
  { id: 8, title: 'เปิดภาคเรียนที่ 2/2568', date: '2026-05-01', type: 'other', description: 'เริ่มต้นภาคเรียนที่ 2' },
  { id: 9, title: 'วันวิสาขบูชา', date: '2026-05-13', type: 'holiday', description: 'วันหยุดราชการ' },
  { id: 10, title: 'สอบปลายภาค ม.1–6', date: '2026-09-15', endDate: '2026-09-19', type: 'exam', description: 'สอบปลายภาคเรียนที่ 1/2568' },
  { id: 11, title: 'กิจกรรมกีฬาสี', date: '2026-02-15', type: 'activity', description: 'การแข่งขันกีฬาสีประจำปี' },
  { id: 12, title: 'อบรมครู ICT', date: '2026-03-15', type: 'meeting', description: 'อบรมเชิงปฏิบัติการครูด้านเทคโนโลยี' },
]

export const useCalendarData = () => {
  const events = useState<CalendarEvent[]>('calendar-events', () => initialEvents.map(r => ({ ...r })))
  return { events }
}
