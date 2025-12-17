import React, { useState } from 'react';
import { StudentRecord, GRADES, Grade } from '../types';
import { Plus, Search, FileDown, Upload, Trash2, Edit, Hash, Users, Phone, Filter, PenTool, ClipboardList } from 'lucide-react';
import { SCHOOL_NAME } from '../constants';

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

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
           <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">{SCHOOL_NAME}</h1>
           <p className="text-slate-500 mt-2 text-lg">Student Directory & Academic Records</p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full xl:w-auto">
           <label className="flex-1 sm:flex-none flex items-center justify-center px-5 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:border-emerald-300 hover:text-emerald-600 cursor-pointer text-sm font-semibold shadow-sm transition-all whitespace-nowrap group">
            <Upload size={18} className="mr-2 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            <span className="flex flex-col items-start leading-none gap-0.5">
                <span>Bulk Upload</span>
                <span className="text-[10px] text-slate-400 font-normal">Students & Marks</span>
            </span>
            <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          </label>
          <button onClick={onExport} className="flex-1 sm:flex-none flex items-center justify-center px-5 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:border-emerald-300 hover:text-emerald-600 text-sm font-semibold shadow-sm transition-all whitespace-nowrap group">
            <FileDown size={18} className="mr-2 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            Export Data
          </button>
          <button onClick={() => setIsModalOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-semibold shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40 transition-all whitespace-nowrap">
            <Plus size={20} className="mr-2" />
            Add Student
          </button>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-slate-100 rounded-lg text-slate-400 group-focus-within:bg-emerald-50 group-focus-within:text-emerald-600 transition-colors">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder="Search by Name, Reg No, or Roll No..." 
            className="w-full pl-14 pr-4 py-3.5 border-none rounded-xl focus:ring-0 outline-none transition-all bg-transparent placeholder-slate-400 text-slate-700 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="h-px md:h-auto md:w-px bg-slate-100 mx-2"></div>
        <div className="relative w-full md:w-64 shrink-0">
             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Filter size={18} />
             </div>
            <select 
            className="w-full pl-12 pr-10 py-3.5 border-none rounded-xl focus:ring-0 outline-none bg-transparent text-slate-700 font-semibold cursor-pointer appearance-none hover:bg-slate-50 transition-colors"
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
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 min-w-[1000px]">
            <thead className="bg-slate-50/80 backdrop-blur-sm border-b border-slate-200">
              <tr>
                <th className="px-6 py-5 font-semibold text-slate-500 uppercase tracking-wider text-xs">Registration</th>
                <th className="px-6 py-5 font-semibold text-slate-500 uppercase tracking-wider text-xs">Student Name</th>
                <th className="px-6 py-5 font-semibold text-slate-500 uppercase tracking-wider text-xs">Class</th>
                <th className="px-6 py-5 font-semibold text-slate-500 uppercase tracking-wider text-xs">Roll No</th>
                <th className="px-6 py-5 font-semibold text-slate-500 uppercase tracking-wider text-xs">Contact</th>
                <th className="px-6 py-5 font-semibold text-slate-500 uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                             <span className="p-1.5 rounded bg-emerald-50 text-emerald-600">
                                <Hash size={14} />
                             </span>
                             <span className="font-mono font-medium text-slate-700">{student.registrationNo || '-'}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 text-base">{student.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{student.fatherName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        Class {student.grade}
                      </span>
                    </td>
                     <td className="px-6 py-4 font-mono text-slate-600 font-medium">#{student.serialNo}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{student.contact}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Quick Add Marks Button */}
                        <button 
                            onClick={() => onSelectStudent(student, 'sem1')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg transition-all text-xs font-semibold border border-emerald-100 hover:border-emerald-600"
                        >
                            <PenTool size={14} />
                            Add Marks
                        </button>
                        <div className="h-6 w-px bg-slate-200 mx-1"></div>
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
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Users size={32} className="text-slate-300" />
                        </div>
                        <p className="text-lg font-semibold text-slate-600">No students found</p>
                        <p className="text-sm mt-1 max-w-xs mx-auto">Try adjusting your search query or class filter to find what you're looking for.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex justify-between items-center font-medium">
            <span>Total: {filteredStudents.length} Students</span>
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
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Registration No</label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input required className="w-full pl-10 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium" 
                      placeholder="e.g. R-2024-001"
                      value={newStudent.registrationNo} onChange={e => setNewStudent({...newStudent, registrationNo: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Roll No</label>
                  <input required className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium" 
                     placeholder="e.g. 101"
                    value={newStudent.serialNo} onChange={e => setNewStudent({...newStudent, serialNo: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Full Name</label>
                    <input required className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                    value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Father's Name</label>
                    <input required className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                    value={newStudent.fatherName} onChange={e => setNewStudent({...newStudent, fatherName: e.target.value})} />
                 </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Class / Grade</label>
                  <div className="relative">
                      <select className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white font-medium appearance-none"
                         value={newStudent.grade} onChange={e => setNewStudent({...newStudent, grade: e.target.value as Grade})}>
                           {GRADES.map(g => <option key={g} value={g}>Class {g}</option>)}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs">▼</div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Date of Birth</label>
                  <input type="date" required className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-600"
                     value={newStudent.dob} onChange={e => setNewStudent({...newStudent, dob: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Contact No</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input required className="w-full pl-10 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                        placeholder="0300-1234567"
                        value={newStudent.contact} onChange={e => setNewStudent({...newStudent, contact: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Form B / CNIC</label>
                  <input required className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                     placeholder="12345-1234567-1"
                     value={newStudent.formB} onChange={e => setNewStudent({...newStudent, formB: e.target.value})} />
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3 shrink-0 border-t border-slate-100 mt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-lg shadow-emerald-600/30 transition-all hover:shadow-xl hover:-translate-y-0.5">Create Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};