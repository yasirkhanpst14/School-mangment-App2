import React, { useState, useRef, useEffect } from 'react';
import { StudentRecord, GRADES, Grade, SUBJECTS, Gender } from '../types';
import { Plus, Search, FileDown, Upload, Trash2, Edit, Hash, Users, Phone, Filter, PenTool, ClipboardList, FileSpreadsheet, Info, ChevronDown, User, CheckCircle2, FileUp, AlertCircle, FileText } from 'lucide-react';
import { SCHOOL_NAME } from '../constants';
import { downloadCSVTemplate } from '../services/storageService';

interface StudentListProps {
  students: StudentRecord[];
  onAddStudent: (s: Omit<StudentRecord, 'id' | 'results'>) => void;
  onDeleteStudent: (id: string) => void;
  onSelectStudent: (s: StudentRecord, tab?: 'profile' | 'sem1' | 'sem2') => void;
  onExport: () => void;
  onImport: (files: File[]) => void;
}

export const StudentList: React.FC<StudentListProps> = ({ 
  students, onAddStudent, onDeleteStudent, onSelectStudent, onExport, onImport 
}) => {
  const [filterGrade, setFilterGrade] = useState<Grade | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  const templateMenuRef = useRef<HTMLDivElement>(null);
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (templateMenuRef.current && !templateMenuRef.current.contains(event.target as Node)) {
        setIsTemplateMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [newStudent, setNewStudent] = useState({
    serialNo: '',
    registrationNo: '',
    name: '',
    fatherName: '',
    gender: 'Male' as Gender,
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleImportSubmit = () => {
    if (selectedFiles.length > 0) {
      onImport(selectedFiles);
      setIsImportModalOpen(false);
      setSelectedFiles([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddStudent(newStudent);
    setIsModalOpen(false);
    setNewStudent({
        serialNo: '', registrationNo: '', name: '', fatherName: '', gender: 'Male', dob: '', formB: '', contact: '', grade: '1'
    });
  };

  const getAvatarGradient = (name: string, gender: Gender) => {
    if (gender === 'Female') return 'from-pink-400 to-rose-500';
    const colors = ['from-emerald-400 to-teal-500', 'from-blue-400 to-indigo-500', 'from-orange-400 to-red-500', 'from-purple-400 to-pink-500', 'from-cyan-400 to-blue-500'];
    const index = name.length % colors.length;
    return colors[index];
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
             <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg">
                <Users size={24} />
             </div>
             <div>
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight leading-none">{SCHOOL_NAME}</h1>
                <p className="text-emerald-600 font-semibold text-sm">Student Management Console</p>
             </div>
           </div>
           <p className="text-slate-500 max-w-lg text-sm leading-relaxed">Secure central database for student records, enrollment profiles, and academic results.</p>
        </div>
        
        <div className="flex flex-col items-end gap-3 w-full xl:w-auto">
            <div className="flex flex-wrap gap-3 w-full xl:w-auto">
                <div className="relative flex-1 sm:flex-none" ref={templateMenuRef}>
                    <button 
                        onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)}
                        className="w-full flex items-center justify-center px-5 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-sm font-semibold shadow-sm transition-all whitespace-nowrap"
                    >
                        <FileSpreadsheet size={18} className="mr-2 text-slate-400" />
                        Download Templates
                        <ChevronDown size={14} className={`ml-2 transition-transform duration-200 ${isTemplateMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isTemplateMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-20 animate-in zoom-in-95 duration-100 origin-top-right">
                             <button onClick={() => { downloadCSVTemplate('bio'); setIsTemplateMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-bold transition-colors">Admission Details</button>
                             <button onClick={() => { downloadCSVTemplate('sem1'); setIsTemplateMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-bold transition-colors mt-1">Semester 1 Marks</button>
                             <button onClick={() => { downloadCSVTemplate('sem2'); setIsTemplateMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-bold transition-colors mt-1">Semester 2 Marks</button>
                        </div>
                    )}
                </div>

                <button 
                  onClick={() => setIsImportModalOpen(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center px-5 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-sm font-semibold shadow-sm transition-all whitespace-nowrap"
                >
                    <Upload size={18} className="mr-2 text-slate-400" />
                    <span>Upload CSV Data</span>
                </button>

                <button onClick={onExport} className="flex-1 sm:flex-none flex items-center justify-center px-5 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-sm font-semibold shadow-sm transition-all whitespace-nowrap">
                    <FileDown size={18} className="mr-2 text-slate-400" />
                    Export All
                </button>

                <button onClick={() => setIsModalOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-bold shadow-lg shadow-emerald-600/30 transition-all active:scale-95">
                    <Plus size={20} className="mr-2" />
                    New Admission
                </button>
            </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search student by name, roll no or ID..." 
            className="w-full pl-12 pr-4 py-3 border-none rounded-xl focus:ring-0 outline-none bg-transparent placeholder-slate-400 text-slate-700 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="h-px md:h-auto md:w-px bg-slate-200 mx-2"></div>
        <div className="relative w-full md:w-64 shrink-0">
             <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select 
                className="w-full pl-12 pr-10 py-3 border-none rounded-xl focus:ring-0 outline-none bg-transparent text-slate-700 font-bold cursor-pointer appearance-none"
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value as any)}
            >
                <option value="All">All Grades</option>
                {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
            </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 min-w-[1100px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-wider text-[10px]">Student Identity</th>
                <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-wider text-[10px]">Gender</th>
                <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-wider text-[10px]">Class / Grade</th>
                <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-wider text-[10px]">Roll Number</th>
                <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-wider text-[10px]">Contact Info</th>
                <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-wider text-[10px]">Result Status</th>
                <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-wider text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                             <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarGradient(student.name, student.gender)} flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0`}>
                                {student.name.charAt(0)}
                             </div>
                             <div className="min-w-0">
                                <div className="font-bold text-slate-800 uppercase tracking-tight truncate">{student.name}</div>
                                <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">
                                    {student.fatherName} • ID: {student.registrationNo || 'UNSET'}
                                </div>
                             </div>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${
                        student.gender === 'Female' ? 'bg-pink-50 text-pink-700 border-pink-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                      }`}>
                        {student.gender}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm whitespace-nowrap">
                            GRADE {student.grade}
                        </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-black text-emerald-900 bg-emerald-50/30 text-center border-x border-slate-50">
                        {student.serialNo}
                    </td>
                    <td className="px-6 py-4">
                        <a href={`tel:${student.contact}`} className="flex items-center gap-2 text-slate-700 hover:text-emerald-600 font-bold font-mono transition-colors whitespace-nowrap">
                            <Phone size={14} className="text-slate-300" />
                            {student.contact}
                        </a>
                    </td>
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-1">
                                <div className={`w-2 h-2 rounded-full border border-white ${student.results.sem1 ? 'bg-emerald-500' : 'bg-slate-200'}`} title="Sem 1"></div>
                                <div className={`w-2 h-2 rounded-full border border-white ${student.results.sem2 ? 'bg-emerald-500' : 'bg-slate-200'}`} title="Sem 2"></div>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                {student.results.sem1 && student.results.sem2 ? 'Finalized' : 'Incomplete'}
                            </span>
                        </div>
                     </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => onSelectStudent(student, 'sem1')} className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all text-[10px] font-black uppercase border border-emerald-100 shadow-sm">
                            <PenTool size={14} /> Marks
                        </button>
                        <button onClick={() => onSelectStudent(student)} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors" title="View Profile">
                            <ClipboardList size={18} />
                        </button>
                        <button onClick={() => onDeleteStudent(student.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Remove Record">
                            <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-slate-400">
                    <Users size={48} className="mx-auto mb-4 opacity-10" />
                    <p className="text-lg font-bold text-slate-600 uppercase tracking-tight">No records match your criteria</p>
                    <p className="text-sm">Try adjusting your filters or search term.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <FileUp className="text-emerald-600" size={24} />
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Bulk Sync (CSV)</h3>
              </div>
              <button onClick={() => { setIsImportModalOpen(false); setSelectedFiles([]); }} className="text-slate-400 hover:text-slate-600 transition-colors font-bold text-xl">×</button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Select CSV File from local storage</label>
                   <input 
                      type="file" 
                      accept=".csv" 
                      multiple
                      onChange={handleFileSelect}
                      className="block w-full text-sm text-slate-500 border border-slate-200 rounded-lg bg-slate-50 p-2 focus:outline-none cursor-pointer"
                   />
                   
                   <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-start gap-2">
                        <Info size={16} className="text-emerald-600 mt-0.5" />
                        <div className="text-[11px] text-slate-500 leading-relaxed font-medium">
                           <p className="font-bold text-slate-700 mb-1 uppercase tracking-tighter">Import Preparation Guide:</p>
                           1. Use our <span className="text-emerald-700 font-bold">Templates</span> for guaranteed compatibility. <br/>
                           2. In Excel, save as <span className="text-emerald-700 font-bold">"CSV (Comma delimited)"</span>. <br/>
                           3. The system will auto-detect <span className="text-indigo-600">Roll No</span>, <span className="text-indigo-600">Grade</span>, and <span className="text-indigo-600">Marks</span>.
                        </div>
                      </div>
                      
                      {selectedFiles.length > 0 && (
                        <div className="pt-2 border-t border-slate-200">
                           <p className="text-[10px] text-emerald-600 font-black uppercase mb-1">Files Ready for Sync:</p>
                           <ul className="text-[11px] text-slate-600 list-disc list-inside">
                             {selectedFiles.map((f, i) => <li key={i}>{f.name}</li>)}
                           </ul>
                        </div>
                      )}
                   </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => { setIsImportModalOpen(false); setSelectedFiles([]); }} 
                  className="px-6 py-2 text-slate-400 font-black text-xs uppercase hover:text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleImportSubmit}
                  disabled={selectedFiles.length === 0}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-black shadow-lg shadow-emerald-600/30 text-xs uppercase disabled:opacity-50 flex items-center gap-2"
                >
                  <CheckCircle2 size={14} /> Start Data Sync
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Manual Enrollment</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors font-bold text-xl">×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Admission No</label>
                  <input required className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-sm" placeholder="R-2025-001" value={newStudent.registrationNo} onChange={e => setNewStudent({...newStudent, registrationNo: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Class Roll No</label>
                  <input required className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-sm" placeholder="101" value={newStudent.serialNo} onChange={e => setNewStudent({...newStudent, serialNo: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                    <input required className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-sm" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Guardian's Name</label>
                    <input required className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-sm" value={newStudent.fatherName} onChange={e => setNewStudent({...newStudent, fatherName: e.target.value})} />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Gender</label>
                  <select className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-bold text-sm" value={newStudent.gender} onChange={e => setNewStudent({...newStudent, gender: e.target.value as Gender})}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Academic Grade</label>
                  <select className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-bold text-sm" value={newStudent.grade} onChange={e => setNewStudent({...newStudent, grade: e.target.value as Grade})}>
                    {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Date of Birth</label>
                  <input type="date" required className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-sm" value={newStudent.dob} onChange={e => setNewStudent({...newStudent, dob: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Primary Contact</label>
                  <input required className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-sm font-mono" placeholder="03XXXXXXXXX" value={newStudent.contact} onChange={e => setNewStudent({...newStudent, contact: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Child Identity (Form B)</label>
                  <input required className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-sm font-mono" placeholder="XXXXX-XXXXXXX-X" value={newStudent.formB} onChange={e => setNewStudent({...newStudent, formB: e.target.value})} />
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-slate-400 font-black text-xs uppercase">Cancel</button>
                <button type="submit" className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-black shadow-lg shadow-emerald-600/30 text-xs uppercase">Confirm Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};