export interface DepartmentRow {
  id: number
  name: string
  code: string
  head: string
  description: string
}

const initialRows: DepartmentRow[] = [
  { id: 1, name: 'ฝ่ายวิชาการ', code: 'ACAD', head: 'นายสมชาย ใจดี', description: 'ดูแลงานด้านหลักสูตรและการเรียนการสอน' },
  { id: 2, name: 'ฝ่ายบริหารทั่วไป', code: 'GEN', head: 'นางสาวอรทัย สวยงาม', description: 'ดูแลงานด้านบริหารและธุรการ' },
  { id: 3, name: 'ฝ่ายงบประมาณ', code: 'BUD', head: 'นายประสิทธิ์ มีผล', description: 'ดูแลงานด้านการเงินและงบประมาณ' },
  { id: 4, name: 'ฝ่ายบุคคล', code: 'HR', head: 'นางวิภา ดีงาม', description: 'ดูแลงานด้านบุคลากรและพัฒนาทรัพยากรมนุษย์' },
  { id: 5, name: 'ฝ่ายกิจการนักเรียน', code: 'STU', head: 'นายมณี แก้วใส', description: 'ดูแลงานด้านกิจกรรมและวินัยนักเรียน' },
]

export const useDepartmentsData = () => {
  const rows = useState<DepartmentRow[]>('departments', () => initialRows.map(r => ({ ...r })))
  return { rows }
}
