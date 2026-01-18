import { collection, getDocs, setDoc, doc, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { StudentRecord, SUBJECTS, Grade, Gender } from "../types";
import * as XLSX from "xlsx";

const STUDENTS_COLLECTION = 'students';
const AUTH_COLLECTION = 'admin';
const AUTH_DOC_ID = 'credentials';

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
    if (!student.id) throw new Error("Student ID is required.");
    await setDoc(doc(db, STUDENTS_COLLECTION, student.id), student);
  } catch (error) {
    console.error("Error saving student:", error);
    throw error;
  }
};

export const removeStudent = async (id: string) => {
  try {
    await deleteDoc(doc(db, STUDENTS_COLLECTION, id));
  } catch (error) {
    console.error("Error deleting student:", error);
  }
};

export const getAdminCredentials = async () => {
  try {
    const docSnap = await getDoc(doc(db, AUTH_COLLECTION, AUTH_DOC_ID));
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    return null;
  }
};

export const saveAdminCredentials = async (creds: {username: string, password: string}) => {
  try {
    await setDoc(doc(db, AUTH_COLLECTION, AUTH_DOC_ID), creds);
  } catch (error) {
    console.error("Error saving admin credentials:", error);
  }
};

/**
 * Robust parser that handles both CSV and Excel formats
 */
export const parseImportFile = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        
        // Clean up keys to be lowercase and alphanumeric for fuzzy matching
        const cleanJson = json.map((row: any) => {
          const newRow: any = {};
          Object.keys(row).forEach(key => {
            const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
            newRow[cleanKey] = row[key];
          });
          return newRow;
        });
        
        resolve(cleanJson);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};

export const robustParseCSV = (text: string): any[] => {
  const cleanText = text.replace(/^\ufeff/, '').trim();
  if (!cleanText) return [];

  const lines = cleanText.split(/\r?\n/);
  if (lines.length < 2) return [];

  // Delimiter detection
  const head = lines[0];
  const delimiter = (head.match(/;/g) || []).length > (head.match(/,/g) || []).length ? ';' : ',';

  const splitLine = (line: string) => {
    const fields = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') inQuotes = !inQuotes;
      else if (char === delimiter && !inQuotes) {
        fields.push(cur.trim());
        cur = '';
      } else cur += char;
    }
    fields.push(cur.trim());
    return fields;
  };

  const rawHeaders = splitLine(lines[0]);
  const headers = rawHeaders.map(h => 
    h.replace(/^"|"$/g, '').trim().toLowerCase().replace(/[^a-z0-9]/g, '')
  );

  return lines.slice(1).map(line => {
    const values = splitLine(line);
    const obj: any = {};
    headers.forEach((h, i) => {
      let val = values[i] ? values[i].replace(/^"|"$/g, '').trim() : '';
      if (h) obj[h] = val;
    });
    return obj;
  });
};

const escapeCSV = (val: any) => {
  const str = String(val ?? '');
  return `"${str.replace(/"/g, '""')}"`;
};

export const downloadCSVTemplate = (type: 'bio' | 'sem1' | 'sem2') => {
    let headers: string[] = [];
    let sample: string[] = [];
    const id = ['SerialNo', 'RegistrationNo', 'Name'];
    const idS = ['101', 'R-2025-001', 'Ali Khan'];

    if (type === 'bio') {
        headers = [...id, 'FatherName', 'Gender', 'Grade', 'DOB', 'FormB', 'Contact'];
        sample = [...idS, 'Zafar Khan', 'Male', '1', '2016-01-01', '12345-1234567-1', '0300-1234567'];
    } else if (type === 'sem1' || type === 'sem2') {
        const prefix = type === 'sem1' ? 'Sem1_' : 'Sem2_';
        headers = [...id, ...SUBJECTS.map(s => `${prefix}${s.replace(/ /g, '')}`)];
        sample = [...idS, ...SUBJECTS.map(() => '80')];
    }

    const content = [headers.map(escapeCSV).join(','), sample.map(escapeCSV).join(',')].join(CRLF);
    const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Template_${type}.csv`;
    link.click();
};

export const exportToCSV = (students: StudentRecord[]) => {
  const headers = ['SerialNo', 'RegistrationNo', 'Name', 'FatherName', 'Gender', 'Grade', 'DOB', 'FormB', 'Contact', ...SUBJECTS.map(s => `Sem1_${s.replace(/ /g, '')}`), ...SUBJECTS.map(s => `Sem2_${s.replace(/ /g, '')}`)];
  const rows = students.map(s => [
    s.serialNo, s.registrationNo, s.name, s.fatherName, s.gender, s.grade, s.dob, s.formB, s.contact,
    ...SUBJECTS.map(sub => s.results.sem1?.marks[sub] ?? ''),
    ...SUBJECTS.map(sub => s.results.sem2?.marks[sub] ?? '')
  ].map(escapeCSV).join(','));

  const content = [headers.map(escapeCSV).join(','), ...rows].join(CRLF);
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Full_Backup_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};