import React, { useState, useRef, useEffect } from 'react';
import { StudentRecord, GRADES, Grade } from '../types';
import { Plus, Search, FileDown, Upload, Trash2, Edit, Hash, Users, Phone, Filter, PenTool, ClipboardList, FileSpreadsheet, Info, ChevronDown, User, CheckCircle2 } from 'lucide-react';
import { SCHOOL_NAME } from '../constants';
import { downloadCSVTemplate } from '../services/storageService';

interface StudentListProps {
  students: StudentRecord[];
  onAddStudent: (s: Omit<StudentRecord, 'id' | 'results'>) => void;
  onDeleteStudent: (id: string) => void;
  onSelectStudent: (s: StudentRecord, tab?: 'profile' | 'sem1' | 'sem2') => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

export const StudentList: React.FC<StudentListProps> = ({ 
  students, onAddStudent, onDeleteStudent, onSelectStudent, onExport, onImport 
}) => {
  const [filterGrade, setFilterGrade] = useState<Grade | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  const templateMenuRef = useRef<HTMLDivElement>(null);
  
  // Close template menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (templateMenuRef.current && !templateMenuRef.current.contains(event.target as Node)) {
        setIsTemplateMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // New student state
  const [newStudent, setNewStudent] = useState({
    serialNo: '',
    registrationNo: '',
    name: '',
    fatherName: '',
    dob: '',
    formB: '',
    contact: '',
    grade: '1' as Grade
  });

  const filteredStudents = students.filter(s => {
    const matchesGrade = filterGrade === 'All' || s.grade === filterGrade;
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.serialNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.registrationNo && s.registrationNo.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesGrade && matchesSearch;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImport(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddStudent(newStudent);
    setIsModalOpen(false);
    setNewStudent({
        serialNo: '', registrationNo: '', name: '', fatherName: '', dob: '', formB: '', contact: '', grade: '1'
    });
  };

  // Helper for random colorful avatars
  const getAvatarGradient = (name: string) => {
    const colors = [
      'from-emerald-400 to-teal-500',
      'from-blue-400 to-indigo-500',
      'from-orange-400 to-red-500',
      'from-purple-400 to-pink-500',
      'from-cyan-400 to-blue-500'
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
             <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                <Users size={24} />
             </div>
             <div>
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight leading-none">{SCHOOL_NAME}</h1>
                <p className="text-emerald-600 font-semibold text-sm">Student Directory</p>
             </div>
           </div>
           <p className="text-slate-500 max-w-lg leading-relaxed">Manage admissions, view profiles, and update academic records seamlessly.</p>
        </div>
        
        <div className="flex flex-col items-end gap-3 w-full xl:w-auto">
            <div className="flex flex-wrap gap-3 w-full xl:w-auto">
                
                {/* Template Download Dropdown */}
                <div className="relative flex-1 sm:flex-none" ref={templateMenuRef}>
                    <button 
                        onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)}
                        className="w-full flex items-center justify-center px-5 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:border-emerald-300 hover:text-emerald-600 text-sm font-semibold shadow-sm transition-all whitespace-nowrap group"
                    >
                        <FileSpreadsheet size={18} className="mr-2 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                        Download Templates
                        <ChevronDown size={14} className={`ml-2 transition-transform duration-200 ${isTemplateMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isTemplateMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-20 animate-in zoom-in-95 duration-100 origin-top-right">
                             <div className="text-[10px] uppercase font-bold text-slate-400 px-3 py-2 tracking-wider">Select Type</div>
                             <button onClick={() => { downloadCSVTemplate('bio'); setIsTemplateMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-sm font-medium transition-colors flex items-center">
                                <User size={14} className="mr-2 opacity-70" /> Admission (Bio-Data)
                             </button>
                             <button onClick={() => { downloadCSVTemplate('sem1'); setIsTemplateMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-sm font-medium transition-colors flex items-center">
                                <PenTool size={14} className="mr-2 opacity-70" /> Semester 1 Marks
                             </button>
                             <button onClick={() => { downloadCSVTemplate('sem2'); setIsTemplateMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-sm font-medium transition-colors flex items-center">
                                <PenTool size={14} className="mr-2 opacity-70" /> Semester 2 Marks
                             </button>
                        </div>
                    )}
                </div>

                <label className="flex-1 sm:flex-none flex items-center justify-center px-5 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:border-emerald-300 hover:text-emerald-600 cursor-pointer text-sm font-semibold shadow-sm transition-all whitespace-nowrap group">
                    <Upload size={18} className="mr-2 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                    <span>Import CSV</span>
                    <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                </label>

                <button onClick={onExport} className="flex-1 sm:flex-none flex items-center justify-center px-5 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:border-emerald-300 hover:text-emerald-600 text-sm font-semibold shadow-sm transition-all whitespace-nowrap group">
                    <FileDown size={18} className="mr-2 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                    Backup Data
                </button>

                <button onClick={() => setIsModalOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-semibold shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40 transition-all whitespace-nowrap active:scale-95">
                    <Plus size={20} className="mr-2" />
                    New Student
                </button>
            </div>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white/60 backdrop-blur-xl p-2 rounded-2xl border border-slate-200/60 shadow-sm sticky top-0 z-10 transition-all">
        <div className="relative flex-1 group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white rounded-lg text-slate-400 shadow-sm group-focus-within:text-emerald-600 transition-colors">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder="Search by Name, Reg No, or Roll No..." 
            className="w-full pl-16 pr-4 py-3.5 border-none rounded-xl focus:ring-0 outline-none transition-all bg-transparent placeholder-slate-400 text-slate-700 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="h-px md:h-auto md:w-px bg-slate-200 mx-2"></div>
        <div className="relative w-full md:w-64 shrink-0">
             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Filter size={18} />
             </div>
            <select 
            className="w-full pl-12 pr-10 py-3.5 border-none rounded-xl focus:ring-0 outline-none bg-transparent text-slate-700 font-semibold cursor-pointer appearance-none hover:bg-white/50 transition-colors"
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value as any)}
            >
            <option value="All">All Classes</option>
            {GRADES.map(g => <option key={g} value={g}>Class {g}</option>)}
            </select>
             <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs font-bold">
                ▼
             </div>
        </div>
      </div>

      {/* Table - Responsive Container */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 min-w-[1000px]">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-5 font-bold text-slate-400 uppercase tracking-wider text-[11px]">Student Identity</th>
                <th className="px-6 py-5 font-bold text-slate-400 uppercase tracking-wider text-[11px]">Class Info</th>
                <th className="px-6 py-5 font-bold text-slate-400 uppercase tracking-wider text-[11px]">Contact</th>
                <th className="px-6 py-5 font-bold text-slate-400 uppercase tracking-wider text-[11px]">Status</th>
                <th className="px-6 py-5 font-bold text-slate-400 uppercase tracking-wider text-[11px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                             <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarGradient(student.name)} flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white`}>
                                {student.name.charAt(0)}
                             </div>
                             <div>
                                <div className="font-bold text-slate-800 text-sm">{student.name}</div>
                                <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                    <span className="font-medium text-slate-500">{student.fatherName}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                    <span className="font-mono">{student.registrationNo || 'No Reg'}</span>
                                </div>
                             </div>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center w-fit px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            Class {student.grade}
                          </span>
                          <div className="text-xs text-slate-500 font-mono ml-1">Roll #: {student.serialNo}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600 bg-slate-50 w-fit px-3 py-1.5 rounded-lg border border-slate-100">
                            <Phone size={12} className="text-slate-400" />
                            <span className="font-mono text-xs font-medium">{student.contact}</span>
                        </div>
                    </td>
                     <td className="px-6 py-4">
                        {/* Status indicators for data completeness */}
                        <div className="flex items-center gap-2">
                            {student.results.sem1 ? (
                                <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center border border-green-100" title="Sem 1 Marks Added">
                                    <span className="text-[10px] font-bold">S1</span>
                                </div>
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center border border-slate-100 border-dashed" title="Sem 1 Pending">
                                    <span className="text-[10px] font-bold">S1</span>
                                </div>
                            )}
                            {student.results.sem2 ? (
                                <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center border border-green-100" title="Sem 2 Marks Added">
                                    <span className="text-[10px] font-bold">S2</span>
                                </div>
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center border border-slate-100 border-dashed" title="Sem 2 Pending">
                                    <span className="text-[10px] font-bold">S2</span>
                                </div>
                            )}
                        </div>
                     </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={() => onSelectStudent(student, 'sem1')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all text-xs font-semibold border border-emerald-100 hover:border-emerald-600 shadow-sm"
                        >
                            <PenTool size={14} />
                            Marks
                        </button>
                        <div className="h-6 w-px bg-slate-100 mx-1"></div>
                       <button 
                        onClick={() => onSelectStudent(student)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="View Full Profile"
                      >
                        <ClipboardList size={18} />
                      </button>
                      <button 
                        onClick={() => onDeleteStudent(student.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Student"
                      >
                        <Trash2 size={18} />
                      </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <Users size={40} className="text-slate-300" />
                        </div>
                        <p className="text-xl font-bold text-slate-700">No students found</p>
                        <p className="text-sm mt-2 text-slate-400 max-w-xs mx-auto">Try adjusting your search query or class filter to find what you're looking for.</p>
                        <button onClick={() => setIsModalOpen(true)} className="mt-6 text-emerald-600 font-semibold hover:underline">
                            Add a new student
                        </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 text-xs text-slate-500 flex justify-between items-center font-medium">
            <span>Showing {filteredStudents.length} of {students.length} students</span>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-800">New Admission</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Enter student details for {SCHOOL_NAME}</p>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Registration No</label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input required className="w-full pl-10 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-sm" 
                      placeholder="e.g. R-2024-001"
                      value={newStudent.registrationNo} onChange={e => setNewStudent({...newStudent, registrationNo: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Roll No</label>
                  <input required className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-sm" 
                     placeholder="e.g. 101"
                    value={newStudent.serialNo} onChange={e => setNewStudent({...newStudent, serialNo: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                    <input required className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-sm"
                    value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Father's Name</label>
                    <input required className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-sm"
                    value={newStudent.fatherName} onChange={e => setNewStudent({...newStudent, fatherName: e.target.value})} />
                 </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Class / Grade</label>
                  <div className="relative">
                      <select className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white font-medium appearance-none text-sm"
                         value={newStudent.grade} onChange={e => setNewStudent({...newStudent, grade: e.target.value as Grade})}>
                           {GRADES.map(g => <option key={g} value={g}>Class {g}</option>)}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs">▼</div>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Date of Birth</label>
                  <input type="date" required className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-600 text-sm"
                     value={newStudent.dob} onChange={e => setNewStudent({...newStudent, dob: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Contact No</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input required className="w-full pl-10 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-sm"
                        placeholder="0300-1234567"
                        value={newStudent.contact} onChange={e => setNewStudent({...newStudent, contact: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Form B / CNIC</label>
                  <input required className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-sm"
                     placeholder="12345-1234567-1"
                     value={newStudent.formB} onChange={e => setNewStudent({...newStudent, formB: e.target.value})} />
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3 shrink-0 border-t border-slate-100 mt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors text-sm">Cancel</button>
                <button type="submit" className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-lg shadow-emerald-600/30 transition-all hover:shadow-xl hover:-translate-y-0.5 text-sm">Create Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};