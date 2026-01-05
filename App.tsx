import React, { useState, useEffect } from 'react';
import { LayoutDashboard, GraduationCap, FileBarChart, Menu, X, School, CalendarRange, PenLine, CalendarCheck, LogOut, UserCircle, Settings, ShieldCheck, Key, Edit3, Save, ChevronDown } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { StudentList } from './components/StudentList';
import { StudentProfile } from './components/StudentProfile';
import { AttendanceManager } from './components/AttendanceManager';
import { Login } from './components/Login';
import { Chatbot } from './components/Chatbot';
import { StudentRecord, SUBJECTS, AttendanceStatus, Grade, Gender } from './types';
import { getStudents, saveStudent, removeStudent, exportToCSV, robustParseCSV } from './services/storageService';
import { SCHOOL_NAME } from './constants';

const generateId = () => Math.random().toString(36).substr(2, 9);
const SESSIONS = ["2023-2024", "2024-2025", "2025-2026", "2026-2027"];

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => sessionStorage.getItem('auth_session') === 'active');
  const [currentView, setCurrentView] = useState<'dashboard' | 'students' | 'profile' | 'attendance'>('dashboard');
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [profileInitialTab, setProfileInitialTab] = useState<'profile' | 'sem1' | 'sem2' | 'dmc' | 'attendance'>('profile');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAiConfigured, setIsAiConfigured] = useState(false);
  const [session, setSession] = useState<string>(() => localStorage.getItem('school_session') || '2024-2025');
  const [isEditingSession, setIsEditingSession] = useState(false);
  const [tempSession, setTempSession] = useState(session);

  useEffect(() => {
    const checkAiKey = async () => {
        if (window.aistudio) {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            setIsAiConfigured(hasKey);
        }
    };
    checkAiKey();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (isAuthenticated) {
        setIsLoading(true);
        try {
            const loaded = await getStudents();
            setStudents(loaded);
        } catch (error) {
            console.error("Failed to load students:", error);
        }
        setIsLoading(false);
      }
    };
    loadData();
  }, [isAuthenticated]);

  const handleLogin = (status: boolean) => {
    if (status) {
        sessionStorage.setItem('auth_session', 'active');
        setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    if(confirm("Are you sure you want to log out?")) {
        sessionStorage.removeItem('auth_session');
        setIsAuthenticated(false);
        setStudents([]);
    }
  };

  const handleAddStudent = async (newStudentData: any) => {
    const id = generateId();
    const newStudent: StudentRecord = { id, ...newStudentData, results: {}, attendance: {} };
    try {
        await saveStudent(newStudent);
        setStudents(prev => [...prev, newStudent]);
    } catch (e) {
        alert("Persistence error.");
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (confirm('Delete student record?')) {
      try {
          await removeStudent(id);
          setStudents(prev => prev.filter(s => s.id !== id));
          if (selectedStudent?.id === id) {
            setSelectedStudent(null);
            setCurrentView('students');
          }
      } catch (e) {
          alert("Delete failed.");
      }
    }
  };

  const handleViewProfile = (student: StudentRecord, tab: 'profile' | 'sem1' | 'sem2' | 'dmc' | 'attendance' = 'profile') => {
    setSelectedStudent(student);
    setProfileInitialTab(tab);
    setCurrentView('profile');
    setIsSidebarOpen(false);
  };

  const handleUpdateStudent = async (updated: StudentRecord) => {
    try {
        await saveStudent(updated);
        setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
        if (selectedStudent?.id === updated.id) setSelectedStudent(updated);
    } catch (e) {
        alert("Update failed.");
    }
  };

  const handleUpdateAttendance = async (updates: { studentId: string; date: string; status: AttendanceStatus }[]) => {
    const updatedStudents = [...students];
    for (const update of updates) {
      const idx = updatedStudents.findIndex(s => s.id === update.studentId);
      if (idx !== -1) {
        const student = JSON.parse(JSON.stringify(updatedStudents[idx]));
        student.attendance = { ...student.attendance, [update.date]: update.status };
        await saveStudent(student);
        updatedStudents[idx] = student;
      }
    }
    setStudents(updatedStudents);
  };

  const handleImport = async (files: File[]) => {
    setIsLoading(true);
    let imported = 0;
    const currentStudents = [...students];

    // Fuzzy header matcher helper
    const getVal = (row: any, keys: string[]) => {
      for (const k of keys) {
        const normalizedK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (row[normalizedK] !== undefined) return row[normalizedK];
      }
      return undefined;
    };

    for (const file of files) {
      try {
        const text = await file.text();
        const data = robustParseCSV(text);
        
        for (const row of data) {
          const serialNo = getVal(row, ['serialno', 'rollno', 'roll', 'id', 'srno']);
          const name = getVal(row, ['name', 'studentname', 'fullname']);
          if (!serialNo || !name) continue;

          const regNo = getVal(row, ['registrationno', 'admissionno', 'regno', 'admissionid']) || '';
          const father = getVal(row, ['fathername', 'guardianname', 'father']) || '';
          const grade = getVal(row, ['grade', 'class']) || '1';
          const genderInput = getVal(row, ['gender', 'sex']) || 'Male';
          const gender = (genderInput.charAt(0).toUpperCase() + genderInput.slice(1).toLowerCase()) as Gender;
          const dob = getVal(row, ['dob', 'dateofbirth']) || '';
          const formB = getVal(row, ['formb', 'cnic', 'identity']) || '';
          const contact = getVal(row, ['contact', 'phone', 'mobile']) || '';

          const processMarks = (sem: 1 | 2) => {
            const marks: any = {};
            let hasMarks = false;
            SUBJECTS.forEach(sub => {
              const subKey = sub.toLowerCase().replace(/[^a-z0-9]/g, '');
              const val = getVal(row, [`sem${sem}${subKey}`, `${subKey}sem${sem}`, `s${sem}${subKey}`]);
              if (val !== undefined && val !== '') {
                marks[sub] = Number(val) || 0;
                hasMarks = true;
              }
            });
            return hasMarks ? { semester: sem, marks, remarks: '', generatedInsight: '' } : null;
          };

          let student = currentStudents.find(s => s.serialNo === serialNo || (regNo && s.registrationNo === regNo));

          if (student) {
            const updated = JSON.parse(JSON.stringify(student));
            if (father) updated.fatherName = father;
            if (grade) updated.grade = grade as Grade;
            updated.gender = gender;
            if (dob) updated.dob = dob;
            if (formB) updated.formB = formB;
            if (contact) updated.contact = contact;

            const m1 = processMarks(1);
            const m2 = processMarks(2);
            if (m1) updated.results.sem1 = m1;
            if (m2) updated.results.sem2 = m2;

            await saveStudent(updated);
            const idx = currentStudents.findIndex(s => s.id === updated.id);
            currentStudents[idx] = updated;
          } else {
            const newStudent: StudentRecord = {
              id: generateId(),
              serialNo, registrationNo: regNo, name, fatherName: father,
              gender, grade: grade as Grade, dob, formB, contact,
              results: { sem1: processMarks(1) || undefined, sem2: processMarks(2) || undefined },
              attendance: {}
            };
            await saveStudent(newStudent);
            currentStudents.push(newStudent);
          }
          imported++;
        }
      } catch (err) {
        console.error("File error:", err);
      }
    }
    setStudents(currentStudents);
    setIsLoading(false);
    alert(`Sync Complete: ${imported} records processed.`);
  };

  const handleConfigureAi = async () => {
      if (window.aistudio) {
          await window.aistudio.openSelectKey();
          setIsAiConfigured(true);
      }
  };

  const handleSaveSession = () => {
    setSession(tempSession);
    localStorage.setItem('school_session', tempSession);
    setIsEditingSession(false);
  };

  if (!isAuthenticated) return <Login onLogin={handleLogin} />;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-emerald-950 text-white z-40 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-8 border-b border-white/5">
            <div className="flex items-center gap-3 mb-1">
              <School className="text-amber-400" size={32} />
              <h1 className="text-xl font-black uppercase tracking-tight leading-none">GPS No1 Bazar</h1>
            </div>
            <p className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase">Admin System</p>
          </div>
          <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
            <button onClick={() => { setCurrentView('dashboard'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${currentView === 'dashboard' ? 'bg-amber-500 text-emerald-950 shadow-lg' : 'hover:bg-white/5 text-emerald-100/70 hover:text-white'}`}>
              <LayoutDashboard size={20} /> Dashboard
            </button>
            <button onClick={() => { setCurrentView('students'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${currentView === 'students' ? 'bg-amber-500 text-emerald-950 shadow-lg' : 'hover:bg-white/5 text-emerald-100/70 hover:text-white'}`}>
              <GraduationCap size={20} /> Student Directory
            </button>
            <button onClick={() => { setCurrentView('attendance'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${currentView === 'attendance' ? 'bg-amber-500 text-emerald-950 shadow-lg' : 'hover:bg-white/5 text-emerald-100/70 hover:text-white'}`}>
              <CalendarCheck size={20} /> Attendance
            </button>
            <div className="pt-8 pb-2 px-5"><p className="text-[10px] font-black text-emerald-400/50 uppercase tracking-widest">Configuration</p></div>
            <button onClick={handleConfigureAi} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${isAiConfigured ? 'text-emerald-100/70' : 'text-amber-400 animate-pulse bg-amber-400/10'} hover:bg-white/5 hover:text-white`}>
              <Key size={20} /> {isAiConfigured ? "AI Key Configured" : "Select AI Project"}
            </button>
          </nav>
          <div className="p-6 border-t border-white/5">
            <button onClick={handleLogout} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-emerald-300 hover:bg-red-500 hover:text-white transition-all font-bold text-sm">
              <LogOut size={20} /> Sign Out
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 shrink-0">
          <button className="lg:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-xl" onClick={() => setIsSidebarOpen(true)}><Menu size={24} /></button>
          <div className="hidden lg:flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] tracking-widest"><CalendarRange size={14} className="text-emerald-600" /> Active Session:</div>
            {isEditingSession ? (
              <div className="flex items-center gap-2 animate-in slide-in-from-left-2">
                <input type="text" value={tempSession} onChange={(e) => setTempSession(e.target.value)} className="px-3 py-1.5 border-2 border-emerald-900 rounded-xl text-sm font-bold text-emerald-950 outline-none" placeholder="2024-25" autoFocus />
                <button onClick={handleSaveSession} className="p-2 bg-emerald-900 text-white rounded-xl shadow-md"><Save size={16} /></button>
                <button onClick={() => setIsEditingSession(false)} className="p-2 text-slate-400"><X size={16} /></button>
              </div>
            ) : (
              <div className="relative group">
                <select value={SESSIONS.includes(session) ? session : "Custom"} onChange={(e) => e.target.value === "Custom" ? setIsEditingSession(true) : (setSession(e.target.value), localStorage.setItem('school_session', e.target.value))} className="appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-2 text-sm font-black text-emerald-950 focus:outline-none cursor-pointer">
                    {SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    {!SESSIONS.includes(session) && <option value={session}>{session}</option>}
                    <option value="Custom">+ Custom Session</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-900 pointer-events-none" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-slate-800 uppercase leading-none">Principal Admin</p>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight mt-1">Institutional Access</p>
            </div>
            <div className="w-10 h-10 bg-emerald-900 rounded-xl flex items-center justify-center text-amber-400 font-bold border border-amber-400 shadow-sm">PA</div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
                <div className="w-10 h-10 border-4 border-emerald-900/10 border-t-emerald-900 rounded-full animate-spin"></div>
                <p className="font-bold uppercase text-[9px] tracking-widest">Synchronizing Database...</p>
            </div>
          ) : (
            <>
              {currentView === 'dashboard' && <Dashboard students={students} session={session} />}
              {currentView === 'students' && <StudentList students={students} onAddStudent={handleAddStudent} onDeleteStudent={handleDeleteStudent} onSelectStudent={handleViewProfile} onExport={() => exportToCSV(students)} onImport={handleImport} />}
              {currentView === 'profile' && selectedStudent && <StudentProfile student={selectedStudent} onBack={() => setCurrentView('students')} onUpdate={handleUpdateStudent} initialTab={profileInitialTab} session={session} />}
              {currentView === 'attendance' && <AttendanceManager students={students} onUpdateBatch={handleUpdateAttendance} />}
            </>
          )}
        </div>
        <Chatbot students={students} />
      </main>
    </div>
  );
};

export default App;