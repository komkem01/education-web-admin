export interface PersonnelRow {
  id: string
  name: string
  dept: string
  roles: string[]
  phone: string
  status: string
}

const initialRows: PersonnelRow[] = [
  { id: 'P001', name: 'นางสาวรุ่งนภา สุขใจ', dept: 'ฝ่ายวิชาการ', roles: ['บุคลากร', 'แอดมิน'], phone: '081-234-5678', status: 'ใช้งาน' },
  { id: 'P002', name: 'นายประสิทธิ์ มีผล', dept: 'ฝ่ายทะเบียน', roles: ['บุคลากร'], phone: '089-876-5432', status: 'ใช้งาน' },
  { id: 'P003', name: 'นางวิลาวัณย์ ดีมาก', dept: 'ฝ่ายพัสดุ', roles: ['บุคลากร', 'ครู'], phone: '083-111-2222', status: 'ใช้งาน' },
  { id: 'P004', name: 'นายสมหมาย ขยันดี', dept: 'ฝ่ายปกครอง', roles: ['บุคลากร'], phone: '087-333-4444', status: 'ไม่ใช้งาน' },
]

export const usePersonnelsData = () => {
  const rows = useState<PersonnelRow[]>('personnels', () => initialRows.map(r => ({ ...r, roles: [...r.roles] })))
  return { rows }
}
