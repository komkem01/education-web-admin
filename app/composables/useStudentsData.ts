import { useState } from '#app'

export interface StudentRow {
  id: string
  name: string
  class: string
  advisor: string
  gpa: string
  discipline: number
  status: string
  // extended personal fields
  idCard: string
  birthdate: string
  phone: string
  address: string
  // parent / guardian
  parentName: string
  parentPhone: string
  parentRelation: string
}

export function useStudentsData() {
  const rows = useState<StudentRow[]>('students-rows', () => [
    {
      id: '66100001', name: 'เด็กชายกิตติ วงษ์ใหญ่', class: 'ม.1/1', advisor: 'ครูสมชาย',
      gpa: '3.50', discipline: 100, status: 'ปกติ',
      idCard: '1-1001-00001-00-1', birthdate: '2555-03-12', phone: '098-111-0001',
      address: '12 ถ.สุขสวัสดิ์ เขตราษฎร์บูรณะ กรุงเทพฯ',
      parentName: 'นายวิชัย วงษ์ใหญ่', parentPhone: '081-000-0001', parentRelation: 'บิดา',
    },
    {
      id: '66100002', name: 'เด็กหญิงนภา รักษ์สกุล', class: 'ม.1/1', advisor: 'ครูสมชาย',
      gpa: '3.80', discipline: 98, status: 'ปกติ',
      idCard: '1-1001-00002-00-2', birthdate: '2555-07-24', phone: '098-111-0002',
      address: '88 ถ.พระราม 2 เขตบางขุนเทียน กรุงเทพฯ',
      parentName: 'นางสาวสุพัตรา รักษ์สกุล', parentPhone: '081-000-0002', parentRelation: 'มารดา',
    },
    {
      id: '65200045', name: 'นายพงษ์ศักดิ์ ดีมาก', class: 'ม.2/3', advisor: 'ครูอรทัย',
      gpa: '2.10', discipline: 72, status: 'ปกติ',
      idCard: '', birthdate: '', phone: '',
      address: '',
      parentName: 'นายสมศักดิ์ ดีมาก', parentPhone: '081-000-0045', parentRelation: 'บิดา',
    },
    {
      id: '65200046', name: 'นางสาวสุภา เรียนดี', class: 'ม.2/3', advisor: 'ครูอรทัย',
      gpa: '3.20', discipline: 95, status: 'รออนุมัติ',
      idCard: '', birthdate: '', phone: '',
      address: '',
      parentName: 'นางมาลี เรียนดี', parentPhone: '081-000-0046', parentRelation: 'มารดา',
    },
    {
      id: '64300012', name: 'นายวุฒิ กล้าหาญ', class: 'ม.3/2', advisor: 'ครูวิชัย',
      gpa: '1.80', discipline: 60, status: 'ปกติ',
      idCard: '', birthdate: '', phone: '',
      address: '',
      parentName: '', parentPhone: '', parentRelation: '',
    },
  ])

  return { rows }
}
