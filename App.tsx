import React, { useState, useEffect } from 'react';
import { Layout, LayoutDashboard, GraduationCap, FileBarChart } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { StudentList } from './components/StudentList';
import { StudentProfile } from './components/StudentProfile';
import { StudentRecord } from './types';
import { getStudents, saveStudents, exportToCSV } from './services/storageService';
import { v4 as uuidv4 } from 'uuid'; // Since we can't install uuid, I'll mock a simple ID generator

// Simple ID gen since we can't import external libs easily in this prompt constraint without build step
const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'students' | 'profile'>('dashboard');
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);

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

  const handleViewProfile = (student: StudentRecord) => {
    setSelectedStudent(student);
    setCurrentView('profile');
  };

  const handleUpdateStudent = (updated: StudentRecord) => {
    setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
    setSelectedStudent(updated);
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n').slice(1); // Skip header
      const newStudents: StudentRecord[] = [];
      
      rows.forEach(row => {
        const cols = row.split(',');
        if (cols.length >= 7) {
          // Simple CSV parse - production would use a library
          const clean = (s: string) => s?.replace(/"/g, '').trim();
          
          newStudents.push({
            id: generateId(),
            serialNo: clean(cols[0]),
            name: clean(cols[1]),
            fatherName: clean(cols[2]),
            grade: clean(cols[3]) as any,
            dob: clean(cols[4]),
            formB: clean(cols[5]),
            contact: clean(cols[6]),
            results: {}
          });
        }
      });

      setStudents(prev => [...prev, ...newStudents]);
      alert(`Imported ${newStudents.length} students successfully.`);
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col no-print shadow-xl z-20">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                <Layout size={20} className="text-white" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">SmartSchool</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setCurrentView('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${currentView === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard size={20} />
            <span className="font-medium">Dashboard</span>
          </button>
          
          <button 
            onClick={() => setCurrentView('students')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${currentView === 'students' || currentView === 'profile' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <GraduationCap size={20} />
            <span className="font-medium">Students</span>
          </button>

          <div className="pt-4 mt-4 border-t border-slate-800">
             <div className="px-4 py-2 text-xs uppercase text-slate-500 font-semibold tracking-wider">System</div>
             <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all cursor-not-allowed opacity-60">
                <FileBarChart size={20} />
                <span>Reports (Beta)</span>
             </button>
          </div>
        </nav>

        <div className="p-4 bg-slate-950 text-xs text-slate-500 text-center">
            v1.0.0 &copy; 2024
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-full relative">
        <header className="bg-white shadow-sm border-b border-slate-200 h-16 flex items-center px-8 justify-between sticky top-0 z-10 no-print">
            <h2 className="text-xl font-semibold text-slate-800 capitalize">
                {currentView === 'profile' ? 'Student Profile' : currentView}
            </h2>
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">A</div>
                <span className="text-sm font-medium text-slate-600">Admin User</span>
            </div>
        </header>

        <div className="h-[calc(100vh-64px)] overflow-y-auto">
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