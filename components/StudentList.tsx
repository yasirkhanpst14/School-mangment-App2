import React, { useState } from 'react';
import { StudentRecord, GRADES, Grade } from '../types';
import { Plus, Search, FileDown, Upload, Trash2, Edit } from 'lucide-react';

interface StudentListProps {
  students: StudentRecord[];
  onAddStudent: (s: Omit<StudentRecord, 'id' | 'results'>) => void;
  onDeleteStudent: (id: string) => void;
  onSelectStudent: (s: StudentRecord) => void;
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
                          s.serialNo.toLowerCase().includes(searchTerm.toLowerCase());
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
        serialNo: '', name: '', fatherName: '', dob: '', formB: '', contact: '', grade: '1'
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Student Directory</h2>
        <div className="flex gap-2">
           <label className="flex items-center justify-center px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer text-sm font-medium shadow-sm transition-colors">
            <Upload size={16} className="mr-2" />
            Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          </label>
          <button onClick={onExport} className="flex items-center px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-medium shadow-sm transition-colors">
            <FileDown size={16} className="mr-2" />
            Export CSV
          </button>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium shadow-md transition-colors">
            <Plus size={16} className="mr-2" />
            Add Student
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by name or serial no..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
          value={filterGrade}
          onChange={(e) => setFilterGrade(e.target.value as any)}
        >
          <option value="All">All Grades</option>
          {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Serial No</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Father Name</th>
                <th className="px-6 py-4">Grade</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-indigo-600">{student.serialNo}</td>
                    <td className="px-6 py-4 text-slate-900 font-medium">{student.name}</td>
                    <td className="px-6 py-4">{student.fatherName}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                        Grade {student.grade}
                      </span>
                    </td>
                    <td className="px-6 py-4">{student.contact}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                       <button 
                        onClick={() => onSelectStudent(student)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="View Profile"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => onDeleteStudent(student.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No students found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">Add New Student</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Serial No</label>
                  <input required className="w-full p-2 border border-slate-300 rounded-lg" 
                    value={newStudent.serialNo} onChange={e => setNewStudent({...newStudent, serialNo: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Grade</label>
                  <select className="w-full p-2 border border-slate-300 rounded-lg"
                     value={newStudent.grade} onChange={e => setNewStudent({...newStudent, grade: e.target.value as Grade})}>
                       {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input required className="w-full p-2 border border-slate-300 rounded-lg"
                   value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Father's Name</label>
                <input required className="w-full p-2 border border-slate-300 rounded-lg"
                   value={newStudent.fatherName} onChange={e => setNewStudent({...newStudent, fatherName: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                  <input type="date" required className="w-full p-2 border border-slate-300 rounded-lg"
                     value={newStudent.dob} onChange={e => setNewStudent({...newStudent, dob: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact No</label>
                  <input required className="w-full p-2 border border-slate-300 rounded-lg"
                     value={newStudent.contact} onChange={e => setNewStudent({...newStudent, contact: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Form B (CNIC)</label>
                <input required className="w-full p-2 border border-slate-300 rounded-lg"
                   value={newStudent.formB} onChange={e => setNewStudent({...newStudent, formB: e.target.value})} />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Student</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};