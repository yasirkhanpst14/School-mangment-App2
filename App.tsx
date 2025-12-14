import React, { useState, useEffect } from 'react';
import { Layout, LayoutDashboard, GraduationCap, FileBarChart, Menu, X, School } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { StudentList } from './components/StudentList';
import { StudentProfile } from './components/StudentProfile';
import { StudentRecord, SUBJECTS, Subject } from './types';
import { getStudents, saveStudents, exportToCSV } from './services/storageService';
import { SCHOOL_NAME } from './constants';

// Simple ID gen
const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'students' | 'profile'>('dashboard');
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [profileInitialTab, setProfileInitialTab] = useState<'profile' | 'sem1' | 'sem2'>('profile');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const loaded = getStudents();
    setStudents(loaded);
  }, []);

  useEffect(() => {
    if(students.length > 0) {
        saveStudents(students);
    }
  }, [students]);

  const handleAddStudent = (newStudentData: any) => {
    const newStudent: StudentRecord = {
      id: generateId(),
      ...newStudentData,
      results: {}
    };
    setStudents(prev => [...prev, newStudent]);
  };

  const handleDeleteStudent = (id: string) => {
    if (confirm('Are you sure you want to delete this student?')) {
      setStudents(prev => prev.filter(s => s.id !== id));
      if (selectedStudent?.id === id) {
        setSelectedStudent(null);
        setCurrentView('students');
      }
    }
  };

  const handleViewProfile = (student: StudentRecord, tab: 'profile' | 'sem1' | 'sem2' = 'profile') => {
    setSelectedStudent(student);
    setProfileInitialTab(tab);
    setCurrentView('profile');
    setIsSidebarOpen(false);
  };

  const handleUpdateStudent = (updated: StudentRecord) => {
    setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
    setSelectedStudent(updated);
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n');
      const header = rows[0].split(',').map(h => h.trim());
      const dataRows = rows.slice(1);
      
      const newStudents: StudentRecord[] = [...students];
      let updatedCount = 0;
      let addedCount = 0;

      // Identify column indices
      const idxSerial = header.indexOf('SerialNo');
      const idxReg = header.indexOf('RegistrationNo');
      
      dataRows.forEach(row => {
        const cols = row.split(',');
        if (cols.length < 5) return; // Skip invalid rows

        const clean = (s: string) => s?.replace(/"/g, '').trim();
        const regNo = clean(cols[idxReg]);
        const serialNo = clean(cols[idxSerial]);
        
        // Find existing student
        let studentIndex = -1;
        if (regNo) studentIndex = newStudents.findIndex(s => s.registrationNo === regNo);
        if (studentIndex === -1 && serialNo) studentIndex = newStudents.findIndex(s => s.serialNo === serialNo);

        if (studentIndex !== -1) {
          // UPDATE EXISTING STUDENT (Bulk Marks Upload)
          const student = newStudents[studentIndex];
          const results = { ...student.results };

          // Parse Marks
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
          
          newStudents[studentIndex] = { ...student, results };
          updatedCount++;
        } else {
          // ADD NEW STUDENT
          const idxName = header.indexOf('Name');
          const idxFather = header.indexOf('FatherName');
          const idxGrade = header.indexOf('Grade');
          const idxDOB = header.indexOf('DOB');
          const idxFormB = header.indexOf('FormB');
          const idxContact = header.indexOf('Contact');

          if (idxName !== -1) {
              newStudents.push({
                id: generateId(),
                serialNo: serialNo,
                registrationNo: regNo,
                name: clean(cols[idxName]),
                fatherName: idxFather !== -1 ? clean(cols[idxFather]) : '',
                grade: idxGrade !== -1 ? clean(cols[idxGrade]) as any : '1',
                dob: idxDOB !== -1 ? clean(cols[idxDOB]) : '',
                formB: idxFormB !== -1 ? clean(cols[idxFormB]) : '',
                contact: idxContact !== -1 ? clean(cols[idxContact]) : '',
                results: {}
              });
              addedCount++;
          }
        }
      });

      setStudents(newStudents);
      alert(`Import Complete!\nAdded: ${addedCount}\nUpdated (Marks): ${updatedCount}`);
    };
    reader.readAsText(file);
  };

  const navigateTo = (view: typeof currentView) => {
    setCurrentView(view);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-30 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0 lg:shadow-none lg:w-72 no-print
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <School size={24} className="text-white" />
                </div>
                <div>
                    <h1 className="text-lg font-bold tracking-tight text-white leading-tight">GPS No 1</h1>
                    <p className="text-xs text-indigo-200 font-medium">Bazar Campus</p>
                </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white transition-colors bg-white/5 p-1.5 rounded-lg">
                <X size={20} />
            </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          <button 
            onClick={() => navigateTo('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group border border-transparent ${currentView === 'dashboard' ? 'bg-indigo-600/90 text-white shadow-md shadow-indigo-900/20 border-indigo-500/50' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
          >
            <LayoutDashboard size={20} className={currentView === 'dashboard' ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
            <span className="font-medium">Dashboard</span>
          </button>
          
          <button 
            onClick={() => navigateTo('students')}
            className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group border border-transparent ${currentView === 'students' || currentView === 'profile' ? 'bg-indigo-600/90 text-white shadow-md shadow-indigo-900/20 border-indigo-500/50' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
          >
            <GraduationCap size={20} className={currentView === 'students' || currentView === 'profile' ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
            <span className="font-medium">Students & Marks</span>
          </button>

          <div className="pt-6 mt-2">
             <div className="px-4 py-2 text-xs uppercase text-slate-500 font-bold tracking-wider mb-1">Analytics</div>
             <button className="w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all cursor-not-allowed opacity-60">
                <FileBarChart size={20} />
                <span>Reports (Beta)</span>
             </button>
          </div>
        </nav>

        <div className="p-4 m-4 bg-black/20 rounded-xl border border-white/5 backdrop-blur-sm">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-400 to-purple-400 flex items-center justify-center text-sm font-bold shadow-md">A</div>
                <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-white truncate">Administrator</p>
                    <p className="text-xs text-indigo-200 truncate opacity-80">admin@gpsbazar.edu</p>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full w-full overflow-hidden relative bg-slate-50">
        <header className="bg-white shadow-sm border-b border-slate-200 h-16 flex items-center px-4 md:px-8 justify-between shrink-0 no-print z-10 sticky top-0">
            <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                <button 
                    onClick={() => setIsSidebarOpen(true)} 
                    className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                    <Menu size={24} />
                </button>
                <div className="h-6 w-px bg-slate-200 hidden lg:block"></div>
                <h2 className="text-lg md:text-xl font-bold text-slate-800 capitalize truncate tracking-tight">
                    {currentView === 'profile' ? 'Student Profile' : currentView}
                </h2>
            </div>
            <div className="flex items-center gap-2 md:gap-3 shrink-0">
                <span className="hidden md:inline-flex text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 items-center">
                    <School size={12} className="mr-1.5" />
                    {SCHOOL_NAME}
                </span>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto scroll-smooth">
            {currentView === 'dashboard' && <Dashboard students={students} />}
            
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
            />
            )}
        </div>
      </main>
    </div>
  );
};

export default App;