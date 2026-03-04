export interface SubjectGroupRow {
  id: number
  name: string
  code: string
  head: string
  description: string
}

const initialRows: SubjectGroupRow[] = [
  { id: 1, name: 'กลุ่มสาระภาษาไทย', code: 'THAI', head: 'ครูสมหญิง ภาษาดี', description: 'สอนวิชาภาษาไทยทุกระดับชั้น' },
  { id: 2, name: 'กลุ่มสาระคณิตศาสตร์', code: 'MATH', head: 'ครูวิชัย เลขเก่ง', description: 'สอนวิชาคณิตศาสตร์ทุกระดับชั้น' },
  { id: 3, name: 'กลุ่มสาระวิทยาศาสตร์และเทคโนโลยี', code: 'SCI', head: 'ครูณัฐพล วิทยาไกล', description: 'สอนวิชาวิทยาศาสตร์ เทคโนโลยี และคอมพิวเตอร์' },
  { id: 4, name: 'กลุ่มสาระสังคมศึกษาฯ', code: 'SOC', head: 'ครูชนิดา สังคมดี', description: 'สอนวิชาสังคมศึกษา ศาสนา และวัฒนธรรม' },
  { id: 5, name: 'กลุ่มสาระภาษาต่างประเทศ', code: 'LANG', head: 'ครูสุดาพร อังกฤษดี', description: 'สอนวิชาภาษาอังกฤษและภาษาต่างประเทศอื่น ๆ' },
  { id: 6, name: 'กลุ่มสาระสุขศึกษาและพลศึกษา', code: 'PE', head: 'ครูกิตติ พละกำลัง', description: 'สอนวิชาสุขศึกษาและพลศึกษา' },
  { id: 7, name: 'กลุ่มสาระศิลปะ', code: 'ART', head: 'ครูมณฑา ศิลป์งาม', description: 'สอนวิชาทัศนศิลป์ ดนตรี นาฏศิลป์' },
  { id: 8, name: 'กลุ่มสาระการงานอาชีพ', code: 'WORK', head: 'ครูอานนท์ การงานดี', description: 'สอนวิชาการงานอาชีพและเทคโนโลยี' },
]

export const useSubjectGroupsData = () => {
  const rows = useState<SubjectGroupRow[]>('subjectGroups', () => initialRows.map(r => ({ ...r })))
  return { rows }
}
