import React, { useState, useEffect } from 'react';
import { LayoutDashboard, GraduationCap, FileBarChart, Menu, X, School, CalendarRange, PenLine, CalendarCheck, LogOut, UserCircle, Settings, ShieldCheck, Key } from 'lucide-react';
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

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('auth_session') === 'active';
  });

  const [currentView, setCurrentView] = useState<'dashboard' | 'students' | 'profile' | 'attendance'>('dashboard');
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [profileInitialTab, setProfileInitialTab] = useState<'profile' | 'sem1' | 'sem2' | 'dmc' | 'attendance'>('profile');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAiConfigured, setIsAiConfigured] = useState(false);
  
  const [session, setSession] = useState<string>(() => {
    return localStorage.getItem('school_session') || '2024-2025';
  });

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
    const newStudent: StudentRecord = {
      id,
      ...newStudentData,
      results: {},
      attendance: {}
    };
    try {
        await saveStudent(newStudent);
        setStudents(prev => [...prev, newStudent]);
    } catch (e) {
        alert("Error saving student to database. Please check your connection.");
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (confirm('Are you sure you want to delete this student record?')) {
      try {
          await removeStudent(id);
          setStudents(prev => prev.filter(s => s.id !== id));
          if (selectedStudent?.id === id) {
            setSelectedStudent(null);
            setCurrentView('students');
          }
      } catch (e) {
          alert("Could not delete student.");
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
        alert("Failed to update student in database.");
    }
  };

  const handleUpdateAttendance = async (updates: { studentId: string; date: string; status: AttendanceStatus }[]) => {
    const updatedStudents = [...students];
    const failedIds: string[] = [];

    for (const update of updates) {
      const idx = updatedStudents.findIndex(s => s.id === update.studentId);
      if (idx !== -1) {
        const student = { ...updatedStudents[idx] };
        student.attendance = { ...student.attendance, [update.date]: update.status };
        try {
            await saveStudent(student);
            updatedStudents[idx] = student;
        } catch (e) {
            failedIds.push(student.name);
        }
      }
    }
    
    if (failedIds.length > 0) {
        alert(`Attendance failed for: ${failedIds.join(', ')}. Please try again.`);
    }
    setStudents(updatedStudents);
  };

  const handleImport = async (files: File[]) => {
    let importedCount = 0;
    let errorCount = 0;
    const currentStudents = [...students];

    setIsLoading(true);

    for (const file of files) {
      try {
        const text = await file.text();
        const data = robustParseCSV(text);
        
        for (const row of data) {
          // Normalize header keys based on robust parser's alphanumeric cleaning
          const serialNo = row['serialno'] || row['rollno'] || row['roll'];
          const regNo = row['registrationno'] || row['admissionno'] || row['regno'] || row['admissionid'];
          const name = row['name'] || row['studentname'];
          
          if (!serialNo || !name) continue;

          // Find existing student by Roll Number or Registration Number
          let student = currentStudents.find(s => 
            s.serialNo === serialNo || 
            (regNo && s.registrationNo === regNo)
          );

          if (student) {
            // Update existing
            const updated = { ...student };
            if (row['fathername'] || row['guardianname']) updated.fatherName = row['fathername'] || row['guardianname'];
            if (row['gender']) updated.gender = (row['gender'].charAt(0).toUpperCase() + row['gender'].slice(1).toLowerCase()) as Gender;
            if (row['grade'] || row['class']) updated.grade = (row['grade'] || row['class']) as Grade;
            if (row['dob']) updated.dob = row['dob'];
            if (row['formb'] || row['cnic']) updated.formB = row['formb'] || row['cnic'];
            if (row['contact'] || row['phone']) updated.contact = row['contact'] || row['phone'];

            // Result Updates
            SUBJECTS.forEach(sub => {
              const subLower = sub.toLowerCase().replace(/[^a-z0-9]/g, '');
              const s1Key = `sem1${subLower}`;
              const s2Key = `sem2${subLower}`;
              
              if (row[s1Key] !== undefined) {
                if (!updated.results.sem1) updated.results.sem1 = { semester: 1, marks: {} as any };
                updated.results.sem1.marks[sub] = Number(row[s1Key]) || 0;
              }
              if (row[s2Key] !== undefined) {
                if (!updated.results.sem2) updated.results.sem2 = { semester: 2, marks: {} as any };
                updated.results.sem2.marks[sub] = Number(row[s2Key]) || 0;
              }
            });

            try {
                await saveStudent(updated);
                const idx = currentStudents.findIndex(s => s.id === updated.id);
                currentStudents[idx] = updated;
                importedCount++;
            } catch (e) {
                errorCount++;
            }
          } else {
            // Create new
            const newStudent: StudentRecord = {
              id: generateId(),
              serialNo,
              registrationNo: regNo || '',
              name,
              fatherName: row['fathername'] || row['guardianname'] || '',
              gender: (row['gender'] ? (row['gender'].charAt(0).toUpperCase() + row['gender'].slice(1).toLowerCase()) : 'Male') as Gender,
              grade: (row['grade'] || row['class'] || '1') as Grade,
              dob: row['dob'] || '',
              formB: row['formb'] || row['cnic'] || '',
              contact: row['contact'] || row['phone'] || '',
              results: {
                sem1: row['sem1english'] !== undefined ? { 
                  semester: 1, 
                  marks: SUBJECTS.reduce((acc, sub) => {
                    const subLower = sub.toLowerCase().replace(/[^a-z0-9]/g, '');
                    return {...acc, [sub]: Number(row[`sem1${subLower}`] || 0)};
                  }, {} as any)
                } : undefined,
                sem2: row['sem2english'] !== undefined ? { 
                  semester: 2, 
                  marks: SUBJECTS.reduce((acc, sub) => {
                    const subLower = sub.toLowerCase().replace(/[^a-z0-9]/g, '');
                    return {...acc, [sub]: Number(row[`sem2${subLower}`] || 0)};
                  }, {} as any)
                } : undefined
              },
              attendance: {}
            };
            try {
                await saveStudent(newStudent);
                currentStudents.push(newStudent);
                importedCount++;
            } catch (e) {
                errorCount++;
            }
          }
        }
      } catch (err) {
        console.error("Error processing file:", file.name, err);
        errorCount++;
      }
    }
    
    setStudents(currentStudents);
    setIsLoading(false);
    alert(`Import complete. Successfully synced ${importedCount} records. Errors: ${errorCount}`);
  };

  const handleConfigureAi = async () => {
      if (window.aistudio) {
          await window.aistudio.openSelectKey();
          setIsAiConfigured(true); // Proceed assuming success
      }
  };

  if (!isAuthenticated) return <Login onLogin={handleLogin} />;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-emerald-950 text-white z-40 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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
            
            <div className="pt-8 pb-2 px-5">
                <p className="text-[10px] font-black text-emerald-400/50 uppercase tracking-widest">Configuration</p>
            </div>
            
            <button 
                onClick={handleConfigureAi}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${isAiConfigured ? 'text-emerald-100/70' : 'text-amber-400 animate-pulse bg-amber-400/10'} hover:bg-white/5 hover:text-white`}
            >
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 shrink-0">
          <button className="lg:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-xl" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          
          <div className="hidden lg:flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] tracking-widest">
            <CalendarRange size={14} className="text-emerald-600" />
            Active Session: {session}
          </div>

          <div className="flex items-center gap-4">
            {!isAiConfigured && (
                 <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-lg text-[9px] font-black text-amber-700 uppercase animate-in slide-in-from-right">
                    <ShieldCheck size={12} /> Pro AI features limited
                 </div>
            )}
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-slate-800 uppercase leading-none">Principal Admin</p>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight mt-1">Institutional Access</p>
            </div>
            <div className="w-10 h-10 bg-emerald-900 rounded-xl flex items-center justify-center text-amber-400 font-bold border border-amber-400 shadow-sm">
              PA
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
                <div className="w-12 h-12 border-4 border-emerald-900/10 border-t-emerald-900 rounded-full animate-spin"></div>
                <p className="font-bold uppercase text-[10px] tracking-widest">Processing Data Store...</p>
            </div>
          ) : (
            <>
              {currentView === 'dashboard' && <Dashboard students={students} session={session} />}
              {currentView === 'students' && (
                <StudentList 
                  students={students} 
                  onAddStudent={handleAddStudent}
                  onDeleteStudent={handleDeleteStudent}
                  onSelectStudent={handleViewProfile}
                  onExport={() => exportToCSV(students)}
                  onImport={handleImport}
                />
              )}
              {currentView === 'profile' && selectedStudent && (
                <StudentProfile 
                  student={selectedStudent} 
                  onBack={() => setCurrentView('students')}
                  onUpdate={handleUpdateStudent}
                  initialTab={profileInitialTab}
                  session={session}
                />
              )}
              {currentView === 'attendance' && (
                <AttendanceManager 
                  students={students}
                  onUpdateBatch={handleUpdateAttendance}
                />
              )}
            </>
          )}
        </div>
        
        <Chatbot students={students} />
      </main>
    </div>
  );
};

export default App;