
import { StudentRecord } from "./types";

export const SCHOOL_NAME = "GPS Bazar No 1";

export const TOTAL_MARKS_PER_SUBJECT = 100;

export const INITIAL_STUDENTS: StudentRecord[] = [
  {
    id: '1',
    serialNo: '101',
    registrationNo: 'R-2024-001',
    name: 'Ahmed Khan',
    fatherName: 'Bilal Khan',
    // Fix: Add missing required gender property
    gender: 'Male',
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
    },
    attendance: {
      '2024-03-01': 'P',
      '2024-03-02': 'P',
      '2024-03-03': 'A',
      '2024-03-04': 'P'
    }
  }
];
