import { collection, getDocs, setDoc, doc, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { StudentRecord, SUBJECTS } from "../types";

const STUDENTS_COLLECTION = 'students';
const AUTH_COLLECTION = 'admin';
const AUTH_DOC_ID = 'credentials';

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
    await setDoc(doc(db, STUDENTS_COLLECTION, student.id), student);
  } catch (error) {
    console.error("Error saving student: ", error);
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

export const downloadCSVTemplate = (type: 'bio' | 'sem1' | 'sem2') => {
    let headers: string[] = [];
    let sampleRow: string[] = [];
    let filename = '';

    const idCols = ['SerialNo', 'RegistrationNo'];
    const idSample = ['101', 'R-2024-001'];

    if (type === 'bio') {
        headers = [...idCols, 'Name', 'FatherName', 'Grade', 'DOB', 'FormB', 'Contact'];
        sampleRow = [...idSample, 'Ali Khan', 'Zafar Khan', '1', '2016-01-01', '12345-1234567-1', '0300-1234567'];
        filename = 'Template_New_Admissions.csv';
    } else if (type === 'sem1') {
        const subHeaders = SUBJECTS.map(s => `Sem1_${s}`);
        headers = [...idCols, 'Name', ...subHeaders];
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
  const sem1Headers = SUBJECTS.map(s => `Sem1_${s}`);
  const sem2Headers = SUBJECTS.map(s => `Sem2_${s}`);

  const headers = [
    'SerialNo', 'RegistrationNo', 'Name', 'FatherName', 'Grade', 'DOB', 'FormB', 'Contact',
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
