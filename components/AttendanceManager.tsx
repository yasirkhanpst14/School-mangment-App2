import React, { useState, useEffect } from 'react';
import { StudentRecord, GRADES, Grade, AttendanceStatus } from '../types';
import { Calendar as CalendarIcon, CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight, Users, CheckSquare } from 'lucide-react';

interface AttendanceManagerProps {
  students: StudentRecord[];
  onUpdateBatch: (updates: { studentId: string; date: string; status: AttendanceStatus }[]) => void;
}

export const AttendanceManager: React.FC<AttendanceManagerProps> = ({ students, onUpdateBatch }) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedGrade, setSelectedGrade] = useState<Grade>('1');

  // Filter students by selected grade
  const classStudents = students.filter(s => s.grade === selectedGrade);

  // Calculate stats for the selected date/class
  const stats = classStudents.reduce(
    (acc, student) => {
      const status = student.attendance?.[selectedDate];
      if (status === 'P') acc.present++;
      else if (status === 'A') acc.absent++;
      else if (status === 'L') acc.leave++;
      else acc.unmarked++;
      return acc;
    },
    { present: 0, absent: 0, leave: 0, unmarked: 0 }
  );

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    onUpdateBatch([{ studentId, date: selectedDate, status }]);
  };

  const handleMarkAllPresent = () => {
    const updates = classStudents.map(s => ({
      studentId: s.id,
      date: selectedDate,
      status: 'P' as AttendanceStatus
    }));
    onUpdateBatch(updates);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      
      {/* Header Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
           <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
             <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
               <CalendarIcon size={24} />
             </div>
             Daily Attendance
           </h1>
           <p className="text-slate-500 mt-1 ml-14 font-medium">Mark and track student presence.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
            <div className="relative">
                <label className="text-[10px] uppercase font-bold text-slate-400 absolute -top-2 left-3 bg-white px-1">Date</label>
                <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full sm:w-auto pl-4 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-700 shadow-sm"
                />
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto">
                {GRADES.map(g => (
                    <button
                        key={g}
                        onClick={() => setSelectedGrade(g)}
                        className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                            selectedGrade === g 
                            ? 'bg-white text-emerald-600 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                        }`}
                    >
                        Class {g}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center gap-3">
              <div className="p-2 bg-emerald-200/50 text-emerald-700 rounded-full"><CheckCircle2 size={18} /></div>
              <div>
                  <p className="text-xs font-bold text-emerald-800 uppercase opacity-70">Present</p>
                  <p className="text-2xl font-black text-emerald-900">{stats.present}</p>
              </div>
          </div>
          <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center gap-3">
              <div className="p-2 bg-red-200/50 text-red-700 rounded-full"><XCircle size={18} /></div>
              <div>
                  <p className="text-xs font-bold text-red-800 uppercase opacity-70">Absent</p>
                  <p className="text-2xl font-black text-red-900">{stats.absent}</p>
              </div>
          </div>
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center gap-3">
              <div className="p-2 bg-amber-200/50 text-amber-700 rounded-full"><Clock size={18} /></div>
              <div>
                  <p className="text-xs font-bold text-amber-800 uppercase opacity-70">Leave</p>
                  <p className="text-2xl font-black text-amber-900">{stats.leave}</p>
              </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-3">
              <div className="p-2 bg-slate-100 text-slate-500 rounded-full"><Users size={18} /></div>
              <div>
                  <p className="text-xs font-bold text-slate-500 uppercase opacity-70">Total</p>
                  <p className="text-2xl font-black text-slate-800">{classStudents.length}</p>
              </div>
          </div>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <Users size={18} />
                Students List ({classStudents.length})
            </h3>
            <button 
                onClick={handleMarkAllPresent}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
            >
                <CheckSquare size={16} />
                Mark All Present
            </button>
        </div>
        
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 min-w-[600px]">
                <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                        <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-wider text-[11px] w-20">Roll #</th>
                        <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-wider text-[11px]">Student Name</th>
                        <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-wider text-[11px]">Father Name</th>
                        <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-wider text-[11px] text-center">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {classStudents.length > 0 ? classStudents.map(student => {
                        const status = student.attendance?.[selectedDate];
                        return (
                            <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-6 py-4 font-mono font-bold text-slate-500">{student.serialNo}</td>
                                <td className="px-6 py-4 font-bold text-slate-800">{student.name}</td>
                                <td className="px-6 py-4 text-slate-500">{student.fatherName}</td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-center gap-2">
                                        <button 
                                            onClick={() => handleStatusChange(student.id, 'P')}
                                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all border-2 ${
                                                status === 'P' 
                                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/30 scale-110' 
                                                : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-emerald-500'
                                            }`}
                                            title="Present"
                                        >
                                            P
                                        </button>
                                        <button 
                                            onClick={() => handleStatusChange(student.id, 'A')}
                                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all border-2 ${
                                                status === 'A' 
                                                ? 'bg-red-500 border-red-500 text-white shadow-md shadow-red-500/30 scale-110' 
                                                : 'bg-white border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-500'
                                            }`}
                                            title="Absent"
                                        >
                                            A
                                        </button>
                                        <button 
                                            onClick={() => handleStatusChange(student.id, 'L')}
                                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all border-2 ${
                                                status === 'L' 
                                                ? 'bg-amber-400 border-amber-400 text-white shadow-md shadow-amber-400/30 scale-110' 
                                                : 'bg-white border-slate-200 text-slate-400 hover:border-amber-300 hover:text-amber-500'
                                            }`}
                                            title="Leave"
                                        >
                                            L
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    }) : (
                        <tr>
                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                No students found in Class {selectedGrade}.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};