export interface SubjectSubGroupRow {
  id: number
  name: string
  code: string
  parentGroup: string
  description: string
}

const initialRows: SubjectSubGroupRow[] = [
  { id: 1, name: 'วิทยาศาสตร์พื้นฐาน', code: 'SCI-01', parentGroup: 'กลุ่มสาระวิทยาศาสตร์และเทคโนโลยี', description: 'วิชาวิทยาศาสตร์พื้นฐานระดับมัธยมต้น' },
  { id: 2, name: 'ฟิสิกส์', code: 'SCI-02', parentGroup: 'กลุ่มสาระวิทยาศาสตร์และเทคโนโลยี', description: 'วิชาฟิสิกส์ระดับมัธยมปลาย' },
  { id: 3, name: 'เคมี', code: 'SCI-03', parentGroup: 'กลุ่มสาระวิทยาศาสตร์และเทคโนโลยี', description: 'วิชาเคมีระดับมัธยมปลาย' },
  { id: 4, name: 'ชีววิทยา', code: 'SCI-04', parentGroup: 'กลุ่มสาระวิทยาศาสตร์และเทคโนโลยี', description: 'วิชาชีววิทยาระดับมัธยมปลาย' },
  { id: 5, name: 'คอมพิวเตอร์และเทคโนโลยี', code: 'SCI-05', parentGroup: 'กลุ่มสาระวิทยาศาสตร์และเทคโนโลยี', description: 'วิชาวิทยาการคำนวณและเทคโนโลยี' },
  { id: 6, name: 'คณิตศาสตร์พื้นฐาน', code: 'MATH-01', parentGroup: 'กลุ่มสาระคณิตศาสตร์', description: 'คณิตศาสตร์พื้นฐานระดับมัธยมต้น' },
  { id: 7, name: 'คณิตศาสตร์เพิ่มเติม', code: 'MATH-02', parentGroup: 'กลุ่มสาระคณิตศาสตร์', description: 'คณิตศาสตร์เพิ่มเติมระดับมัธยมปลาย' },
  { id: 8, name: 'ภาษาอังกฤษพื้นฐาน', code: 'LANG-01', parentGroup: 'กลุ่มสาระภาษาต่างประเทศ', description: 'ภาษาอังกฤษพื้นฐานทุกระดับชั้น' },
  { id: 9, name: 'ภาษาจีน', code: 'LANG-02', parentGroup: 'กลุ่มสาระภาษาต่างประเทศ', description: 'ภาษาจีนระดับมัธยมศึกษา' },
  { id: 10, name: 'ภาษาไทยพื้นฐาน', code: 'THAI-01', parentGroup: 'กลุ่มสาระภาษาไทย', description: 'ภาษาไทยพื้นฐานทุกระดับชั้น' },
]

export const useSubjectSubGroupsData = () => {
  const rows = useState<SubjectSubGroupRow[]>('subjectSubGroups', () => initialRows.map(r => ({ ...r })))
  return { rows }
}
