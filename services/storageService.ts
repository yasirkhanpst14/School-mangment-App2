import { collection, getDocs, setDoc, doc, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { StudentRecord, SUBJECTS, Grade, Gender } from "../types";

const STUDENTS_COLLECTION = 'students';
const AUTH_COLLECTION = 'admin';
const AUTH_DOC_ID = 'credentials';

// UTF-8 BOM for Excel compatibility (crucial for older versions to detect encoding correctly)
const BOM = '\ufeff';
const CRLF = '\r\n';

export const getStudents = async (): Promise<StudentRecord[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, STUDENTS_COLLECTION));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentRecord));
  } catch (error) {
    console.error("Error fetching students: ", error);
    return [];
  }
};

export const saveStudent = async (student: StudentRecord) => {
  try {
    // Ensure ID is present
    if (!student.id) throw new Error("Student ID is required for saving.");
    await setDoc(doc(db, STUDENTS_COLLECTION, student.id), student);
  } catch (error) {
    console.error("Error saving student to Firebase: ", error);
    throw error;
  }
};

export const removeStudent = async (id: string) => {
  try {
    await deleteDoc(doc(db, STUDENTS_COLLECTION, id));
  } catch (error) {
    console.error("Error deleting student: ", error);
  }
};

export const getAdminCredentials = async () => {
  try {
    const docSnap = await getDoc(doc(db, AUTH_COLLECTION, AUTH_DOC_ID));
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching admin credentials: ", error);
    return null;
  }
};

export const saveAdminCredentials = async (creds: {username: string, password: string}) => {
  try {
    await setDoc(doc(db, AUTH_COLLECTION, AUTH_DOC_ID), creds);
  } catch (error) {
    console.error("Error saving admin credentials: ", error);
  }
};

/**
 * Robust CSV Parser for high compatibility with various Excel versions
 */
export const robustParseCSV = (text: string): any[] => {
  // Remove BOM and common hidden characters
  let cleanText = text.replace(/^\ufeff/, '').replace(/[\u200B-\u200D\uFEFF]/g, '');
  
  // Split into lines, handle CRLF and LF
  const lines = cleanText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 1) return [];

  // Detect delimiter (comma vs semicolon)
  const firstLine = lines[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const delimiter = semiCount > commaCount ? ';' : ',';

  const splitLine = (line: string) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const rawHeaders = splitLine(lines[0]);
  
  // Normalize headers: remove quotes, remove spaces, special chars, and lowercase
  const headers = rawHeaders.map(h => 
    h.replace(/^"|"$/g, '')
     .trim()
     .toLowerCase()
     .replace(/[^a-z0-9]/g, '') // Strips all symbols and spaces
  );

  return lines.slice(1).map(line => {
    const values = splitLine(line);
    const obj: any = {};
    headers.forEach((h, i) => {
      // Clean values: remove outer quotes
      let val = values[i] ? values[i].replace(/^"|"$/g, '').trim() : '';
      obj[h] = val;
    });
    return obj;
  });
};

const escapeCSV = (val: any) => {
  const str = String(val === null || val === undefined ? '' : val);
  return `"${str.replace(/"/g, '""')}"`;
};

export const downloadCSVTemplate = (type: 'bio' | 'sem1' | 'sem2') => {
    let headers: string[] = [];
    let sampleRow: string[] = [];
    let filename = '';

    const idCols = ['SerialNo', 'RegistrationNo'];
    const idSample = ['101', 'R-2025-001'];

    if (type === 'bio') {
        headers = [...idCols, 'Name', 'FatherName', 'Gender', 'Grade', 'DOB', 'FormB', 'Contact'];
        sampleRow = [...idSample, 'Ali Khan', 'Zafar Khan', 'Male', '1', '2016-01-01', '12345-1234567-1', '0300-1234567'];
        filename = 'Template_Student_Bio.csv';
    } else if (type === 'sem1') {
        const subHeaders = SUBJECTS.map(s => `Sem1_${s}`);
        headers = [...idCols, 'Name', ...subHeaders];
        sampleRow = [...idSample, 'Ali Khan', ...SUBJECTS.map(() => '0')];
        filename = 'Template_Marks_Sem1.csv';
    } else if (type === 'sem2') {
        const subHeaders = SUBJECTS.map(s => `Sem2_${s}`);
        headers = [...idCols, 'Name', ...subHeaders];
        sampleRow = [...idSample, 'Ali Khan', ...SUBJECTS.map(() => '0')];
        filename = 'Template_Marks_Sem2.csv';
    }

    const csvContent = [
      headers.map(escapeCSV).join(','), 
      sampleRow.map(escapeCSV).join(',')
    ].join(CRLF);
    
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
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
  const sem1Headers = SUBJECTS.map(s => `Sem1_${s}`);
  const sem2Headers = SUBJECTS.map(s => `Sem2_${s}`);

  const headers = [
    'SerialNo', 'RegistrationNo', 'Name', 'FatherName', 'Gender', 'Grade', 'DOB', 'FormB', 'Contact',
    ...sem1Headers,
    ...sem2Headers
  ];
  
  const rows = students.map(s => {
    const getMark = (sem: 1 | 2, subj: string) => {
      const res = sem === 1 ? s.results.sem1 : s.results.sem2;
      return res?.marks?.[subj as any] ?? '';
    };

    const sem1Values = SUBJECTS.map(subj => getMark(1, subj));
    const sem2Values = SUBJECTS.map(subj => getMark(2, subj));

    return [
      s.serialNo,
      s.registrationNo || '',
      s.name,
      s.fatherName,
      s.gender,
      s.grade,
      s.dob,
      s.formB,
      s.contact,
      ...sem1Values,
      ...sem2Values
    ].map(escapeCSV).join(',');
  });

  const csvContent = [
    headers.map(escapeCSV).join(','), 
    ...rows
  ].join(CRLF);
  
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Database_Backup_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};