import React, { useState, useEffect } from 'react';
import { LayoutDashboard, GraduationCap, FileBarChart, Menu, X, School, CalendarRange, PenLine, CalendarCheck, LogOut, UserCircle } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { StudentList } from './components/StudentList';
import { StudentProfile } from './components/StudentProfile';
import { AttendanceManager } from './components/AttendanceManager';
import { Login } from './components/Login';
import { Chatbot } from './components/Chatbot';
import { StudentRecord, SUBJECTS, AttendanceStatus } from './types';
import { getStudents, saveStudent, removeStudent, exportToCSV } from './services/storageService';
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
  
  const [session, setSession] = useState<string>(() => {
    return localStorage.getItem('school_session') || '2024-2025';
  });
  const [isEditingSession, setIsEditingSession] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (isAuthenticated) {
        setIsLoading(true);
        const loaded = await getStudents();
        setStudents(loaded);
        setIsLoading(false);
      }
    };
    loadData();
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('school_session', session);
  }, [session]);

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
    setStudents(prev => [...prev, newStudent]);
    await saveStudent(newStudent);
  };

  const handleDeleteStudent = async (id: string) => {
    if (confirm('Are you sure you want to delete this student record?')) {
      setStudents(prev => prev.filter(s => s.id !== id));
      await removeStudent(id);
      if (selectedStudent?.id === id) {
        setSelectedStudent(null);
        setCurrentView('students');
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
    setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
    setSelectedStudent(updated);
    await saveStudent(updated);
  };

  const handleBatchUpdateAttendance = async (updates: { studentId: string; date: string; status: AttendanceStatus }[]) => {
    const updatedStudents = [...students];
    for (const update of updates) {
      const idx = updatedStudents.findIndex(s => s.id === update.studentId);
      if (idx !== -1) {
        const student = {
          ...updatedStudents[idx],
          attendance: {
            ...updatedStudents[idx].attendance,
            [update.date]: update.status
          }
        };
        updatedStudents[idx] = student;
        await saveStudent(student);
      }
    }
    setStudents(updatedStudents);
  };

  const handleImport = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n');
      const header = rows[0].split(',').map(h => h.trim());
      const dataRows = rows.slice(1);
      
      const newStudents: StudentRecord[] = [...students];
      let updatedCount = 0;
      let addedCount = 0;

      const idxSerial = header.indexOf('SerialNo');
      const idxReg = header.indexOf('RegistrationNo');
      
      for (const row of dataRows) {
        const cols = row.split(',');
        if (cols.length < 5) continue;

        const clean = (s: string) => s?.replace(/"/g, '').trim();
        const regNo = clean(cols[idxReg]);
        const serialNo = clean(cols[idxSerial]);
        
        let studentIndex = -1;
        if (regNo) studentIndex = newStudents.findIndex(s => s.registrationNo === regNo);
        if (studentIndex === -1 && serialNo) studentIndex = newStudents.findIndex(s => s.serialNo === serialNo);

        if (studentIndex !== -1) {
          const student = newStudents[studentIndex];
          const results = { ...student.results };

          SUBJECTS.forEach(subj => {
             const sem1Idx = header.indexOf(`Sem1_${subj}`);
             const sem2Idx = header.indexOf(`Sem2_${subj}`);

             if (sem1Idx !== -1 && cols[sem1Idx] && cols[sem1Idx].trim() !== '') {
                 if (!results.sem1) results.sem1 = { semester: 1, marks: {} as any };
                 results.sem1.marks[subj] = Number(clean(cols[sem1Idx]));
             }
             if (sem2Idx !== -1 && cols[sem2Idx] && cols[sem2Idx].trim() !== '') {
                 if (!results.sem2) results.sem2 = { semester: 2, marks: {} as any };
                 results.sem2.marks[subj] = Number(clean(cols[sem2Idx]));
             }
          });
          
          const updatedStudent = { ...student, results };
          newStudents[studentIndex] = updatedStudent;
          await saveStudent(updatedStudent);
          updatedCount++;
        } else {
          const idxName = header.indexOf('Name');
          const idxFather = header.indexOf('FatherName');
          const idxGrade = header.indexOf('Grade');
          const idxDOB = header.indexOf('DOB');
          const idxFormB = header.indexOf('FormB');
          const idxContact = header.indexOf('Contact');

          if (idxName !== -1) {
              const freshStudent: StudentRecord = {
                id: generateId(),
                serialNo: serialNo,
                registrationNo: regNo,
                name: clean(cols[idxName]),
                fatherName: idxFather !== -1 ? clean(cols[idxFather]) : '',
                grade: idxGrade !== -1 ? clean(cols[idxGrade]) as any : '1',
                dob: idxDOB !== -1 ? clean(cols[idxDOB]) : '',
                formB: idxFormB !== -1 ? clean(cols[idxFormB]) : '',
                contact: idxContact !== -1 ? clean(cols[idxContact]) : '',
                results: {},
                attendance: {}
              };
              newStudents.push(freshStudent);
              await saveStudent(freshStudent);
              addedCount++;
          }
        }
      }

      setStudents(newStudents);
      alert(`Import Complete!\nAdded: ${addedCount}\nUpdated (Marks): ${updatedCount}`);
    };
    reader.readAsText(file);
  };

  const navigateTo = (view: typeof currentView) => {
    setCurrentView(view);
    setIsSidebarOpen(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900 font-sans overflow-hidden">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-30 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-gradient-to-b from-emerald-950 to-emerald-900 text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0 lg:shadow-none lg:w-72 no-print
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 border border-amber-400/50 rounded-xl flex items-center justify-center shadow-lg">
                    <School size={24} className="text-amber-400" />
                </div>
                <div>
                    <h1 className="text-lg font-black tracking-tight text-white leading-tight uppercase">{SCHOOL_NAME}</h1>
                    <p className="text-[10px] text-amber-200 font-black uppercase tracking-widest opacity-80">School Management</p>
                </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-emerald-100 hover:text-white transition-colors bg-white/5 p-1.5 rounded-lg">
                <X size={20} />
            </button>
        </div>
        
        <div className="px-4 py-4 border-b border-white/10">
          <div className="bg-black/20 rounded-2xl p-4 border border-white/5 shadow-inner">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-amber-300 font-black uppercase tracking-widest flex items-center gap-1.5">
                 <CalendarRange size={12} /> Academic Year
              </span>
              <button onClick={() => setIsEditingSession(!isEditingSession)} className="text-emerald-200 hover:text-white transition-colors">
                 <PenLine size={12} />
              </button>
            </div>
            {isEditingSession ? (
              <input 
                type="text" 
                value={session}
                onChange={(e) => setSession(e.target.value)}
                onBlur={() => setIsEditingSession(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingSession(false)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-amber-400"
                autoFocus
              />
            ) : (
              <div className="font-black text-xl text-white tracking-widest">{session}</div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          <button 
            onClick={() => navigateTo('dashboard')}
            className={`w-full flex items-center space-x-3 px-5 py-4 rounded-2xl transition-all duration-200 group border border-transparent ${currentView === 'dashboard' ? 'bg-amber-500 text-emerald-950 shadow-lg shadow-amber-500/20' : 'text-emerald-100/70 hover:bg-white/5 hover:text-white'}`}
          >
            <LayoutDashboard size={20} className={currentView === 'dashboard' ? 'text-emerald-950' : 'text-amber-400 group-hover:text-white'} />
            <span className="font-black text-xs uppercase tracking-widest">Dashboard</span>
          </button>
          
          <button 
            onClick={() => navigateTo('attendance')}
            className={`w-full flex items-center space-x-3 px-5 py-4 rounded-2xl transition-all duration-200 group border border-transparent ${currentView === 'attendance' ? 'bg-amber-500 text-emerald-950 shadow-lg shadow-amber-500/20' : 'text-emerald-100/70 hover:bg-white/5 hover:text-white'}`}
          >
            <CalendarCheck size={20} className={currentView === 'attendance' ? 'text-emerald-950' : 'text-amber-400 group-hover:text-white'} />
            <span className="font-black text-xs uppercase tracking-widest">Attendance</span>
          </button>

          <button 
            onClick={() => navigateTo('students')}
            className={`w-full flex items-center space-x-3 px-5 py-4 rounded-2xl transition-all duration-200 group border border-transparent ${currentView === 'students' || currentView === 'profile' ? 'bg-amber-500 text-emerald-950 shadow-lg shadow-amber-500/20' : 'text-emerald-100/70 hover:bg-white/5 hover:text-white'}`}
          >
            <UserCircle size={20} className={currentView === 'students' || currentView === 'profile' ? 'text-emerald-950' : 'text-amber-400 group-hover:text-white'} />
            <span className="font-black text-xs uppercase tracking-widest">Students Profile</span>
          </button>

          <div className="pt-6 mt-2">
             <div className="px-5 py-2 text-[10px] uppercase text-amber-300/60 font-black tracking-widest mb-1">Reports</div>
             <button className="w-full flex items-center space-x-3 px-5 py-4 rounded-2xl text-emerald-100/40 hover:bg-white/5 hover:text-white transition-all cursor-not-allowed opacity-60">
                <FileBarChart size={20} />
                <span className="font-black text-xs uppercase tracking-widest">Examination</span>
             </button>
          </div>
        </nav>

        <div className="p-4 m-4 mt-0 bg-black/20 rounded-2xl border border-white/5 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center text-emerald-950 text-sm font-black shadow-md border border-white/20">A</div>
                <div className="overflow-hidden">
                    <p className="text-[11px] font-black text-white truncate uppercase tracking-tight">Admin</p>
                    <p className="text-[9px] text-amber-200 truncate opacity-80 uppercase tracking-widest">System Manager</p>
                </div>
            </div>
            <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-emerald-100 hover:text-red-200 transition-colors text-[10px] font-black uppercase tracking-widest border border-white/5 hover:border-red-500/30"
            >
                <LogOut size={14} /> Log Out
            </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full w-full overflow-hidden relative bg-slate-100">
        <header className="bg-white shadow-md border-b-4 border-amber-400 h-16 flex items-center px-4 md:px-8 justify-between shrink-0 no-print z-10 sticky top-0">
            <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                <button 
                    onClick={() => setIsSidebarOpen(true)} 
                    className="lg:hidden p-2 -ml-2 text-emerald-900 hover:text-emerald-950 hover:bg-emerald-50 rounded-xl transition-colors"
                >
                    <Menu size={24} />
                </button>
                <div className="h-6 w-px bg-slate-200 hidden lg:block"></div>
                <h2 className="text-base md:text-lg font-black text-emerald-950 uppercase truncate tracking-tight">
                    {currentView === 'profile' ? 'Student Profile' : currentView}
                </h2>
            </div>
            <div className="flex items-center gap-2 md:gap-3 shrink-0">
                <span className="hidden md:inline-flex text-[10px] font-black text-emerald-900 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 items-center shadow-sm uppercase tracking-widest">
                    <School size={14} className="mr-2 text-amber-500" />
                    {SCHOOL_NAME}
                </span>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                 <div className="w-14 h-14 border-4 border-emerald-100 border-t-emerald-900 rounded-full animate-spin"></div>
                 <p className="font-black text-[10px] uppercase tracking-widest text-emerald-900/60">Syncing Database...</p>
              </div>
            ) : (
              <div className="p-0 animate-in fade-in duration-700">
                {currentView === 'dashboard' && <Dashboard students={students} session={session} />}
                {currentView === 'attendance' && <AttendanceManager students={students} onUpdateBatch={handleBatchUpdateAttendance} />}
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
                      initialTab={profileInitialTab}
                      onBack={() => setCurrentView('students')}
                      onUpdate={handleUpdateStudent}
                      session={session}
                  />
                )}
              </div>
            )}
        </div>
        
        {/* Persistent Chatbot Overlay */}
        <Chatbot students={students} />
      </main>
    </div>
  );
};

export default App;