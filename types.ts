export type Grade = '1' | '2' | '3' | '4' | '5';

export const GRADES: Grade[] = ['1', '2', '3', '4', '5'];

export type Subject = 
  | 'English' 
  | 'Urdu' 
  | 'Pashto' 
  | 'Math' 
  | 'General Science' 
  | 'Social Study' 
  | 'Islamiyat' 
  | 'Nazira' 
  | 'Drawing';

export const SUBJECTS: Subject[] = [
  'English', 
  'Urdu', 
  'Pashto', 
  'Math', 
  'General Science', 
  'Social Study', 
  'Islamiyat', 
  'Nazira', 
  'Drawing'
];

export interface Student {
  id: string;
  serialNo: string; // Class Roll No
  registrationNo: string; // Admission/Registration No
  name: string;
  fatherName: string;
  dob: string;
  formB: string; // CNIC/Identity for child
  contact: string;
  grade: Grade;
}

export interface SubjectMarks {
  subject: Subject;
  total: number;
  obtained: number;
}

export interface SemesterResult {
  semester: 1 | 2;
  marks: Record<Subject, number>; // Subject Name -> Obtained Marks
  remarks?: string;
  generatedInsight?: string;
}

export type AttendanceStatus = 'P' | 'A' | 'L'; // Present, Absent, Leave

export interface StudentRecord extends Student {
  results: {
    sem1?: SemesterResult;
    sem2?: SemesterResult;
  };
  attendance?: Record<string, AttendanceStatus>; // Date (YYYY-MM-DD) -> Status
}

export interface DashboardStats {
  totalStudents: number;
  gradeDistribution: { name: string; value: number }[];
}