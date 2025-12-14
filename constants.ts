import { StudentRecord } from "./types";

export const TOTAL_MARKS_PER_SUBJECT = 100;

export const INITIAL_STUDENTS: StudentRecord[] = [
  {
    id: '1',
    serialNo: 'S-101',
    name: 'Ahmed Khan',
    fatherName: 'Bilal Khan',
    dob: '2015-05-12',
    formB: '12345-1234567-1',
    contact: '0300-1234567',
    grade: '5',
    results: {
      sem1: {
        semester: 1,
        marks: {
          'English': 85,
          'Urdu': 78,
          'Pashto': 80,
          'Math': 92,
          'General Science': 88,
          'Social Study': 75,
          'Islamiyat': 90,
          'Nazira': 95,
          'Drawing': 82
        },
        remarks: 'Excellent performance.'
      }
    }
  },
  {
    id: '2',
    serialNo: 'S-102',
    name: 'Fatima Ali',
    fatherName: 'Zafar Ali',
    dob: '2016-08-20',
    formB: '12345-7654321-2',
    contact: '0333-9876543',
    grade: '4',
    results: {}
  }
];