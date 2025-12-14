import { StudentRecord, SUBJECTS } from "../types";
import { INITIAL_STUDENTS } from "../constants";

const STORAGE_KEY = 'school_manager_data_v3'; // Bumped version

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
  link.setAttribute('download', `GPS_No1_Bazar_Data_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};