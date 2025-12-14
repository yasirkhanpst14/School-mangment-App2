import { StudentRecord } from "../types";
import { INITIAL_STUDENTS } from "../constants";

const STORAGE_KEY = 'school_manager_data_v1';

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
  // Flatten data for CSV
  const headers = [
    'SerialNo', 'Name', 'FatherName', 'Grade', 'DOB', 'FormB', 'Contact',
    // Sem 1
    'Sem1_Total', 'Sem1_Percentage',
    // Sem 2
    'Sem2_Total', 'Sem2_Percentage'
  ];
  
  const rows = students.map(s => {
    const sem1Total = s.results.sem1 ? Object.values(s.results.sem1.marks).reduce((a, b) => a + b, 0) : 0;
    const sem1Perc = s.results.sem1 ? (sem1Total / 900 * 100).toFixed(2) : '0';
    
    const sem2Total = s.results.sem2 ? Object.values(s.results.sem2.marks).reduce((a, b) => a + b, 0) : 0;
    const sem2Perc = s.results.sem2 ? (sem2Total / 900 * 100).toFixed(2) : '0';

    return [
      s.serialNo,
      `"${s.name}"`, // Quote strings with spaces
      `"${s.fatherName}"`,
      s.grade,
      s.dob,
      s.formB,
      s.contact,
      sem1Total,
      `${sem1Perc}%`,
      sem2Total,
      `${sem2Perc}%`
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'school_data_export.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};