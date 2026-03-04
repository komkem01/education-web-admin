export interface ApprovalRow {
  id: number
  type: string
  requester: string
  role: string
  detail: string
  date: string
  status: string
  note?: string
}

const initialRows: ApprovalRow[] = [
  { id: 1, type: 'ขอแก้ไขข้อมูลนักเรียน', requester: 'ครูสมชาย ใจดี', role: 'ครู', detail: 'แก้ชื่อ-สกุล เลขที่ 66100001', date: '04/03/68', status: 'รออนุมัติ' },
  { id: 2, type: 'ขอเปิดรายวิชาใหม่', requester: 'ครูอรทัย สวยงาม', role: 'ครู', detail: 'วิชาฟิสิกส์เพิ่มเติม ม.5', date: '04/03/68', status: 'รออนุมัติ' },
  { id: 3, type: 'ขอเอกสารรายวิชา', requester: 'ครูวิชัย มานะ', role: 'ครู', detail: 'แบบฟอร์ม ปพ.5 ภาค 1/68', date: '03/03/68', status: 'รออนุมัติ' },
  { id: 4, type: 'ลงทะเบียนผู้ปกครอง', requester: 'บุคลากรทะเบียน', role: 'บุคลากร', detail: 'ผู้ปกครอง เด็กชายกิตติ', date: '03/03/68', status: 'รออนุมัติ' },
  { id: 5, type: 'ขอแก้ไขข้อมูลส่วนตัว', requester: 'ครูสุรชัย ตั้งใจ', role: 'ครู', detail: 'เบอร์โทรและที่อยู่', date: '02/03/68', status: 'รออนุมัติ' },
  { id: 6, type: 'ขอแก้ไขรายวิชา', requester: 'ครูมาลี รักเรียน', role: 'ครู', detail: 'ปรับจำนวนหน่วยกิตวิชา ENG101', date: '01/03/68', status: 'อนุมัติแล้ว' },
]

export const useApprovalsData = () => {
  const rows = useState<ApprovalRow[]>('approvals', () => initialRows.map(r => ({ ...r })))
  return { rows }
}
