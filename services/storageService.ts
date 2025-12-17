import { StudentRecord, SUBJECTS } from "../types";
import { INITIAL_STUDENTS } from "../constants";

const STORAGE_KEY = 'school_manager_data_v3'; 
const AUTH_KEY = 'school_manager_auth_v1';

export const getStudents = (): StudentRecord[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("Failed to parse storage", e);
      return INITIAL_STUDENTS;
    }
  }
  return INITIAL_STUDENTS;
};

export const saveStudents = (students: StudentRecord[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
};

export const getAdminCredentials = () => {
  const data = localStorage.getItem(AUTH_KEY);
  return data ? JSON.parse(data) : null;
};

export const saveAdminCredentials = (creds: {username: string, password: string}) => {
  localStorage.setItem(AUTH_KEY, JSON.stringify(creds));
};

export const downloadCSVTemplate = (type: 'bio' | 'sem1' | 'sem2') => {
    let headers: string[] = [];
    let sampleRow: string[] = [];
    let filename = '';

    // Common columns used for matching
    const idCols = ['SerialNo', 'RegistrationNo'];
    const idSample = ['101', 'R-2024-001'];

    if (type === 'bio') {
        headers = [...idCols, 'Name', 'FatherName', 'Grade', 'DOB', 'FormB', 'Contact'];
        sampleRow = [...idSample, 'Ali Khan', 'Zafar Khan', '1', '2016-01-01', '12345-1234567-1', '0300-1234567'];
        filename = 'Template_New_Admissions.csv';
    } else if (type === 'sem1') {
        const subHeaders = SUBJECTS.map(s => `Sem1_${s}`);
        headers = [...idCols, 'Name', ...subHeaders];
        // Note: Name is included for reference to help the teacher, though not strictly needed for logic if RegNo exists
        sampleRow = [...idSample, 'Ali Khan (Ref Only)', ...SUBJECTS.map(() => '')];
        filename = 'Template_Semester_1_Marks.csv';
    } else if (type === 'sem2') {
        const subHeaders = SUBJECTS.map(s => `Sem2_${s}`);
        headers = [...idCols, 'Name', ...subHeaders];
        sampleRow = [...idSample, 'Ali Khan (Ref Only)', ...SUBJECTS.map(() => '')];
        filename = 'Template_Semester_2_Marks.csv';
    }

    const csvContent = [headers.join(','), sampleRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const exportToCSV = (students: StudentRecord[]) => {
  // Generate dynamic headers for subjects
  const sem1Headers = SUBJECTS.map(s => `Sem1_${s}`);
  const sem2Headers = SUBJECTS.map(s => `Sem2_${s}`);

  const headers = [
    'SerialNo', 'RegistrationNo', 'Name', 'FatherName', 'Grade', 'DOB', 'FormB', 'Contact',
    ...sem1Headers,
    ...sem2Headers
  ];
  
  const rows = students.map(s => {
    // Helper to get mark or empty string
    const getMark = (sem: 1 | 2, subj: string) => {
      const res = sem === 1 ? s.results.sem1 : s.results.sem2;
      return res?.marks?.[subj as any] ?? '';
    };

    const sem1Values = SUBJECTS.map(subj => getMark(1, subj));
    const sem2Values = SUBJECTS.map(subj => getMark(2, subj));

    return [
      s.serialNo,
      s.registrationNo || '',
      `"${s.name}"`,
      `"${s.fatherName}"`,
      s.grade,
      s.dob,
      s.formB,
      s.contact,
      ...sem1Values,
      ...sem2Values
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `GPS_No1_Bazar_Full_Data_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};