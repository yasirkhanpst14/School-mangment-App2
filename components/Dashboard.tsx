import React from 'react';
import { StudentRecord, GRADES } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Users, GraduationCap, TrendingUp, Trophy, CalendarCheck } from 'lucide-react';
import { SCHOOL_NAME } from '../constants';

interface DashboardProps {
  students: StudentRecord[];
  session: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ students, session }) => {
  
  const gradeDistribution = GRADES.map(grade => ({
    name: `Class ${grade}`,
    value: students.filter(s => s.grade === grade).length
  }));

  const totalStudents = students.length;
  
  // Calculate average performance per grade for Semester 1 (approximate)
  const performanceData = GRADES.map(grade => {
    const studentsInGrade = students.filter(s => s.grade === grade);
    let totalScore = 0;
    let studentCount = 0;
    
    studentsInGrade.forEach(s => {
      if (s.results.sem1) {
        const marks = Object.values(s.results.sem1.marks) as number[];
        const avg = marks.reduce((a: number, b: number) => a + b, 0) / marks.length;
        totalScore += avg;
        studentCount++;
      }
    });

    return {
      grade: `Class ${grade}`,
      avgScore: studentCount > 0 ? Math.round(totalScore / studentCount) : 0
    };
  });

  const overallAvg = Math.round(performanceData.reduce((acc, curr) => acc + curr.avgScore, 0) / 5);

  // Calculate Today's Attendance
  const today = new Date().toISOString().split('T')[0];
  let presentCount = 0;
  let absentCount = 0;
  let totalMarked = 0;
  
  students.forEach(s => {
    if (s.attendance?.[today]) {
        totalMarked++;
        if(s.attendance[today] === 'P') presentCount++;
        if(s.attendance[today] === 'A') absentCount++;
    }
  });
  
  const attendancePercentage = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 0;

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight leading-tight">Admin Dashboard</h2>
            <p className="text-slate-500 mt-2 font-medium">Welcome back to {SCHOOL_NAME} Management</p>
        </div>
        <div className="px-5 py-2.5 bg-white rounded-xl border border-slate-200 text-sm font-bold text-slate-600 shadow-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Academic Session {session}
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center space-x-5 hover:shadow-lg transition-all relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-50 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="p-4 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-500/30 relative z-10">
            <Users size={28} />
          </div>
          <div className="relative z-10">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Students</p>
            <h3 className="text-4xl font-black text-slate-800">{totalStudents}</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center space-x-5 hover:shadow-lg transition-all relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-sky-50 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="p-4 bg-gradient-to-br from-sky-400 to-sky-500 text-white rounded-2xl shadow-lg shadow-sky-500/30 relative z-10">
            <CalendarCheck size={28} />
          </div>
          <div className="relative z-10">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Attendance (Today)</p>
            <h3 className="text-4xl font-black text-slate-800">
               {totalMarked > 0 ? `${attendancePercentage}%` : '-'}
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">
                {totalMarked > 0 ? `${presentCount} Present / ${totalMarked} Marked` : 'Not marked yet'}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center space-x-5 hover:shadow-lg transition-all relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-amber-50 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="p-4 bg-gradient-to-br from-amber-400 to-amber-500 text-white rounded-2xl shadow-lg shadow-amber-500/30 relative z-10">
            <TrendingUp size={28} />
          </div>
          <div className="relative z-10">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Avg Score (S1)</p>
            <h3 className="text-4xl font-black text-slate-800">
              {overallAvg}%
            </h3>
          </div>
        </div>
        
         <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-3xl shadow-xl text-white flex items-center space-x-5 relative overflow-hidden ring-4 ring-slate-50">
          <div className="absolute right-0 bottom-0 w-40 h-40 bg-white/5 rounded-full -mr-12 -mb-12"></div>
          <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md relative z-10 border border-white/10">
            <Trophy size={28} className="text-yellow-300" />
          </div>
          <div className="relative z-10">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Best Performing</p>
            <h3 className="text-3xl font-black text-white">Class 5</h3>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 h-[28rem] flex flex-col">
          <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center">
            <div className="w-1.5 h-6 bg-indigo-500 rounded-full mr-4"></div>
            Student Enrollment by Class
          </h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} />
                <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px'}}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={40} />
                </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 h-[28rem] flex flex-col">
          <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center">
             <div className="w-1.5 h-6 bg-emerald-500 rounded-full mr-4"></div>
             Performance Overview
          </h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                <defs>
                    <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} domain={[0, 100]} />
                <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px'}}
                />
                <Area type="monotone" dataKey="avgScore" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorAvg)" />
                </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};