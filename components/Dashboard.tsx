import React from 'react';
import { StudentRecord, GRADES } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Users, GraduationCap, TrendingUp, Trophy } from 'lucide-react';
import { SCHOOL_NAME } from '../constants';

interface DashboardProps {
  students: StudentRecord[];
}

export const Dashboard: React.FC<DashboardProps> = ({ students }) => {
  
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
        const marks = Object.values(s.results.sem1.marks);
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

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Admin Dashboard</h2>
            <p className="text-slate-500 mt-1 font-medium">{SCHOOL_NAME} Overview</p>
        </div>
        <div className="px-4 py-2 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 shadow-sm">
            Academic Session 2024-25
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-4 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="p-3.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/30 relative z-10">
            <Users size={24} />
          </div>
          <div className="relative z-10">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Students</p>
            <h3 className="text-3xl font-black text-slate-800">{totalStudents}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-4 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="p-3.5 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/30 relative z-10">
            <GraduationCap size={24} />
          </div>
          <div className="relative z-10">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Active Classes</p>
            <h3 className="text-3xl font-black text-slate-800">5</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-4 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-amber-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="p-3.5 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-500/30 relative z-10">
            <TrendingUp size={24} />
          </div>
          <div className="relative z-10">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Avg Score (Sem 1)</p>
            <h3 className="text-3xl font-black text-slate-800">
              {overallAvg}%
            </h3>
          </div>
        </div>
        
         <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-2xl shadow-lg text-white flex items-center space-x-4 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mb-10"></div>
          <div className="p-3.5 bg-white/20 rounded-xl backdrop-blur-sm relative z-10">
            <Trophy size={24} />
          </div>
          <div className="relative z-10">
            <p className="text-xs font-bold text-indigo-100 uppercase tracking-wide">Top Class</p>
            <h3 className="text-2xl font-black text-white">Class 5</h3>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-96 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
            <div className="w-1 h-6 bg-indigo-500 rounded-full mr-3"></div>
            Student Enrollment
          </h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={50} />
                </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-96 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
             <div className="w-1 h-6 bg-emerald-500 rounded-full mr-3"></div>
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
                <XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} domain={[0, 100]} />
                <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="avgScore" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAvg)" />
                </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};